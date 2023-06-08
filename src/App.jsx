import { io } from 'socket.io-client'
import { useEffect, useRef, useState } from 'react'

const socket = io('http://localhost:3000', {
  autoConnect: false
})

const chatColStyles = {
  minHeight: '335px',
  maxHeight: '335px',
  height: '335px',
}

const chatPanelStyles = {
  height: 'calc(100% - 48px)',
  overflowX: 'hidden',
  overflowY: 'auto',
}

function App() {
  const messageRef = useRef()
  const [user, setUser] = useState('')
  const [contact, setContact] = useState('')
  const [users] = useState(['Rogger', 'Juan', 'Carlos'])
  const [signedIn, setSignedIn] = useState(false)
  const [typing, setTyping] = useState({})
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])

  const handleChangeUser = (event) => {
    setUser(event.target.value)
  }

  const handleSignIn = (event) => {
    event.preventDefault()

    if (user?.trim()) {
      socket.connect()

      setSignedIn(true)
      setUser((prevState) => prevState.trim())
    }
  }

  const handleSelectContact = (contact) => () => {
    setContact(contact)
    messageRef.current?.focus()
  }

  const handleChangeMessage = (event) => {
    const value = event.target.value

    if (value?.trim()) {
      socket.emit('typing', {
        from: user,
        to: contact,
      })
    } else {
      socket.emit('noTyping')
    }

    setMessage(event.target.value)
  }

  const handleSendMessage = (event) => {
    event.preventDefault()

    const newMessage = {
      message,
      from: user,
      to: contact,
    }

    socket.emit('noTyping')
    socket.emit('message', newMessage)

    setMessage('')
    setMessages((prevState) => [
      ...prevState,
      newMessage
    ])
  }

  useEffect(() => {
    function onTypingResponse(data) {
      setTyping(data)
    }

    function onNoTypingResponse() {
      setTyping({})
    }

    function onMessageResponse(newMessage) {
      setMessages((prevState) => [
        ...prevState,
        newMessage,
      ])
    }

    socket.on('typingResponse', onTypingResponse)
    socket.on('noTypingResponse', onNoTypingResponse)
    socket.on('messageResponse', onMessageResponse)

    return () => {
      socket.off('typingResponse', onTypingResponse)
      socket.off('noTypingResponse', onNoTypingResponse)
      socket.off('messageResponse', onMessageResponse)
    }
  }, [])

  useEffect(() => {
    if (signedIn) {
      messageRef.current?.focus()
    }
  }, [signedIn])

  return (
    <div className='h-100 p-3'>
      <div className='row g-2 justify-content-center align-items-center h-100'>

        {!signedIn && (
          <div className='col-sm-6 col-lg-3'>
            <div className='card'>
              <div className='card-body'>
                <form onSubmit={handleSignIn}>
                  <select
                    value={user}
                    className='form-select form-select-sm mb-3'
                    onChange={handleChangeUser}
                  >
                    <option value=''>
                      - Select -
                    </option>
                    {users.map((user) => (
                      <option
                        key={user}
                        value={user}
                      >
                        {user}
                      </option>
                    ))}
                  </select>
                  <button
                    disabled={!user?.trim()}
                    className='btn btn-primary btn-sm w-100'
                  >
                    Sign In
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {signedIn && (
          <>
            <div className='col-sm-4 col-lg-2'>
              <div
                className='card'
                style={chatColStyles}
              >
                <div className='card-body p-0'>
                  <div className='list-group list-group-flush'>
                    {users.filter((item) => item !== user).map((item, index) => (
                      <button
                        key={index}
                        type='button'
                        className={`list-group-item list-group-item-action ${(item === contact) ? 'active' : ''}`.trim()}
                        onClick={handleSelectContact(item)}
                      >
                        {item}
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
                {contact?.trim() && (
                  <>
                    <div className='card-header'>
                      <h5 className='card-title m-0'>
                        {contact}
                      </h5>
                      {(typing.from === contact && typing.to === user) && (
                        <small>
                          escribiendo...
                        </small>
                      )}
                    </div>
                    <div className='card-body'>
                      <form
                        className='h-100'
                        onSubmit={handleSendMessage}
                      >
                        <div
                          className='border rounded mb-3 p-3'
                          style={chatPanelStyles}
                        >
                          {messages
                            .filter((message) => (
                              (message.from === user && message.to === contact) ||
                              (message.from === contact && message.to === user)
                            ))
                            .map((message, index) => {
                              if (message.from !== user) {
                                return (
                                  <div
                                    key={index}
                                    className={`row justify-content-start g-1 ${index === 0 ? '' : 'mt-2'}`}
                                  >
                                    <div className='col-5'>
                                      <p className='border rounded bg-light p-1 m-0'>
                                        <span className='fw-semibold'>
                                          {message.from}:
                                        </span>
                                        &nbsp;{message.message}
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
                                    <p className='border rounded bg-primary bg-opacity-25 p-1 m-0'>
                                      <span className='fw-semibold'>
                                        Tú:
                                      </span>
                                      &nbsp;{message.message}
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
                              disabled={!contact?.trim()}
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
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default App
