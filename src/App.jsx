import { io } from 'socket.io-client'
import { useEffect, useRef, useState } from 'react'
import moment from 'moment/moment'

const apiUrl = 'http://localhost:3000'

const chatColStyles = {
  minHeight: '335px',
  maxHeight: '335px',
  height: '335px',
  overflow: 'hidden'
}

const chatPanelStyles = {
  height: '210px',
  minHeight: '210px',
  maxHeight: '210px',
  overflowX: 'hidden',
  overflowY: 'auto',
}

const messageStyles = {
  fontSize: '0.9rem',
}

const messageDateStyles = {
  fontSize: '0.7rem',
}

const initialUsers = [
  { id: 9, username: 'Rogger', email: 'rogger.ortiz.br@gmail.com', password: '12345678' },
  { id: 16, username: 'Juan', email: 'justin.chow@example.com', password: '12345678' },
  { id: 17, username: 'Carlos', email: 'jora.hop@example.com', password: '12345678' },
]

function App() {
  const chatPanelRef = useRef()
  const messageRef = useRef()
  const [socket, setSocket] = useState()
  const [users] = useState(initialUsers)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState()
  const [contact, setContact] = useState()
  const [signedIn, setSignedIn] = useState(false)
  const [token, setToken] = useState('')
  const [typing, setTyping] = useState()
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])

  const scrollToTop = () => {
    chatPanelRef.current?.scrollTo({
      top: 400,
      behavior: 'smooth',
    })
  }

  const handleChangeUser = (event) => {
    setUser(users.find((user) => user.id === Number(event.target.value)))
  }

  const handleSignIn = async (event) => {
    event.preventDefault()

    try {
      if (!user?.id) {
        return
      }

      setLoading(true)

      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: user.email,
          password: user.password
        })
      })

      const data = await response.json()
      const token = data.tokens.access_token

      const socket = io(apiUrl, { query: { token } })
      socket.connect()

      setSocket(socket)
      setToken(token)
    }
    catch {
      setLoading(false)
      setError('Error al autenticar')
    }
  }

  const handleSignOut = () => {
    socket.disconnect()
    setSocket()
    setLoading(false)
    setError('')
    setUser()
    setContact()
    setSignedIn(false)
    setTyping(false)
    setMessage('')
    setMessages([])
  }

  const handleSelectContact = (contact) => async () => {
    setMessages([])
    setContact(contact)
    messageRef.current?.focus()

    try {
      if (!user?.id) {
        return
      }

      const response = await fetch(`${apiUrl}/api/user-message/${contact.id}`, {
        method: 'get',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      setMessages(data)
    }
    catch {
      setMessages([])
    }
  }

  const handleChangeMessage = (event) => {
    const value = event.target.value

    if (value?.trim() && user && contact) {
      socket.emit('typing', {
        from_user_id: user.id,
        to_user_id: contact.id,
      })
    } else {
      socket.emit('noTyping')
    }

    setMessage(event.target.value)
  }

  const handleSendMessage = (event) => {
    event.preventDefault()

    if (!message?.trim() || !user || !contact) {
      return
    }

    const body = {
      from_user_id: user.id,
      to_user_id: contact.id,
      message,
      created_at: new Date()
    }

    socket.emit('noTyping')
    socket.emit('message', body)

    setMessage('')
    setMessages((prevState) => [...prevState, body])
  }

  useEffect(() => {
    if (!socket) {
      return
    }

    function onConnect() {
      setLoading(false)
      setSignedIn(true)
      setError('')
    }

    function onConnectError(error) {
      setLoading(false)
      setSignedIn(false)
      setError(error.message)
    }

    function onTypingResponse(body) {
      setTyping(body)
    }

    function onNoTypingResponse() {
      setTyping()
    }

    function onMessageResponse(body) {
      setMessages((prevState) => [
        ...prevState,
        body,
      ])
    }

    socket.on("connect", onConnect)
    socket.on("connect_error", onConnectError)
    socket.on('typingResponse', onTypingResponse)
    socket.on('noTypingResponse', onNoTypingResponse)
    socket.on('messageResponse', onMessageResponse)

    return () => {
      socket.off("connect", onConnect)
      socket.off("connect_error", onConnectError)
      socket.off('typingResponse', onTypingResponse)
      socket.off('noTypingResponse', onNoTypingResponse)
      socket.off('messageResponse', onMessageResponse)
    }
  }, [socket])

  useEffect(() => {
    if (contact) {
      messageRef.current?.focus()
    }
  }, [contact])

  useEffect(() => {
    scrollToTop()
  }, [contact, messages])

  return (
    <div className='h-100 p-3'>
      <div className='row g-2 justify-content-center align-items-center h-100'>

        {(!user || !signedIn) && (
          <div className='col-sm-6 col-lg-3'>
            <div className='card'>
              <div className='card-body'>
                <form onSubmit={handleSignIn}>
                  <select
                    disabled={loading}
                    value={user?.id ?? ''}
                    className='form-select form-select-sm'
                    onChange={handleChangeUser}
                  >
                    <option value=''>
                      - Select -
                    </option>
                    {users.map((item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.username}
                      </option>
                    ))}
                  </select>

                  {error && (
                    <p className='text-danger mt-1 mb-0'>
                      <small>
                        {error}
                      </small>
                    </p>
                  )}

                  <button
                    disabled={!user || loading}
                    className='btn btn-primary btn-sm w-100 mt-2'
                  >
                    {loading ? 'Cargando...' : 'Ingresar'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {(user && signedIn) && (
          <>
            <div className='col-sm-4 col-lg-2'>
              <div
                className='card'
                style={chatColStyles}
              >
                <div className='card-header d-flex justify-content-between align-items-center'>
                  <h6 className='card-title m-0'>
                    Contacts
                  </h6>

                  <button
                    className='btn btn-primary btn-sm py-0'
                    onClick={handleSignOut}
                  >
                    Salir
                  </button>
                </div>

                <div className='card-body p-0'>
                  <div className='list-group list-group-flush'>
                    {users.filter((item) => item.id !== user.id).map((item, index) => (
                      <button
                        key={index}
                        type='button'
                        className={`list-group-item list-group-item-action ${(item.id === contact?.id) ? 'active' : ''}`.trim()}
                        onClick={handleSelectContact(item)}
                      >
                        {item.username}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className='col-sm-8 col-lg-5'>
              <div
                className='card'
                style={chatColStyles}
              >
                {contact?.id && (
                  <>
                    <div className='card-header'>
                      <h6 className='card-title'>
                        {contact.username}

                        {(typing?.from_user_id === contact.id && typing?.to_user_id === user.id) && (
                          <small>
                            escribiendo...
                          </small>
                        )}
                      </h6>
                    </div>

                    <div className='card-body'>
                      <form
                        className='h-100'
                        onSubmit={handleSendMessage}
                      >
                        <div
                          ref={chatPanelRef}
                          className='border rounded mb-3 p-3'
                          style={chatPanelStyles}
                        >
                          {messages.map((message, index) => {
                              if (message.from_user_id !== user.id) {
                                return (
                                  <div
                                    key={index}
                                    className={`row justify-content-start g-1 ${index === 0 ? '' : 'mt-2'}`}
                                  >
                                    <div className='col-5'>
                                      <p
                                        className='border rounded bg-light p-1 m-0'
                                        style={messageStyles}
                                      >
                                        {message.message}
                                      </p>

                                      <p
                                        className='p-1 m-0'
                                        style={messageDateStyles}
                                      >
                                        {moment(message.created_at).format('DD/MM/YYYY HH:mm')}
                                      </p>
                                    </div>
                                  </div>
                                )
                              }

                              return (
                                <div
                                  key={index}
                                  className={`row justify-content-end g-1 ${index === 0 ? '' : 'mt-2'}`}
                                >
                                  <div className='col-5'>
                                    <p
                                      className='border rounded bg-primary bg-opacity-25 p-1 m-0'
                                      style={messageStyles}
                                    >
                                      {message.message}
                                    </p>

                                    <p
                                      className='text-end p-1 m-0'
                                      style={messageDateStyles}
                                    >
                                      {moment(message.created_at).format('DD/MM/YYYY HH:mm')}
                                    </p>
                                  </div>
                                </div>
                              )
                            })}
                        </div>

                        <div className='row g-1'>
                          <div className='col'>
                            <input
                              type='text'
                              value={message}
                              ref={messageRef}
                              disabled={!contact}
                              className='form-control form-control-sm'
                              onChange={handleChangeMessage}
                            />
                          </div>
                          <div className='col-auto'>
                            <button
                              disabled={!message?.trim()}
                              className='btn btn-primary btn-sm'
                            >
                              Send
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </>
                )}

                {!contact?.id && (
                  <div className='card-body d-flex justify-content-center align-items-center'>
                    <span>
                      Select a Contact
                    </span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div >
  )
}

export default App
