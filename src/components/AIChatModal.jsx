import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Send, Trash2, AlertCircle, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import useStore from '../store/useStore'

export default function AIChatModal() {
  const chatOpen = useStore((state) => state.chatOpen)
  const closeChat = useStore((state) => state.closeChat)
  const deepseekApiKey = useStore((state) => state.deepseekApiKey)
  const chatMessages = useStore((state) => state.chatMessages)
  const addChatMessage = useStore((state) => state.addChatMessage)
  const chatLoading = useStore((state) => state.chatLoading)
  const setChatLoading = useStore((state) => state.setChatLoading)
  const clearChat = useStore((state) => state.clearChat)
  const initialChatMessage = useStore((state) => state.initialChatMessage)
  const clearInitialChatMessage = useStore((state) => state.clearInitialChatMessage)

  const [input, setInput] = useState('')
  const [streamingMessage, setStreamingMessage] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, streamingMessage])

  useEffect(() => {
    if (chatOpen) {
      inputRef.current?.focus()
      if (initialChatMessage) {
        sendInitialMessage(initialChatMessage)
        clearInitialChatMessage()
      }
    }
  }, [chatOpen, initialChatMessage])

  const sendInitialMessage = useCallback(async (message) => {
    if (!message.trim() || chatLoading) return

    if (!deepseekApiKey) {
      addChatMessage({
        role: 'assistant',
        content: 'Configure sua API key do DeepSeek nas configurações para usar o chat.',
        error: true
      })
      return
    }

    const userMessage = { role: 'user', content: message.trim() }
    addChatMessage(userMessage)
    setChatLoading(true)
    setStreamingMessage('')

    try {
      const messages = [userMessage].map(m => ({
        role: m.role,
        content: m.content
      }))

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deepseekApiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          stream: true
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Erro na API')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices[0]?.delta?.content || ''
              if (content) {
                fullContent += content
                setStreamingMessage(fullContent)
              }
            } catch (e) {
              // Ignora erros de parse em chunks incompletos
            }
          }
        }
      }

      if (fullContent) {
        addChatMessage({
          role: 'assistant',
          content: fullContent
        })
      }
    } catch (error) {
      addChatMessage({
        role: 'assistant',
        content: `Erro: ${error.message}`,
        error: true
      })
    } finally {
      setChatLoading(false)
      setStreamingMessage('')
    }
  }, [chatLoading, deepseekApiKey, addChatMessage, setChatLoading])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || chatLoading) return

    if (!deepseekApiKey) {
      addChatMessage({
        role: 'assistant',
        content: 'Configure sua API key do DeepSeek nas configurações para usar o chat.',
        error: true
      })
      return
    }

    const userMessage = { role: 'user', content: input.trim() }
    addChatMessage(userMessage)
    setInput('')
    setChatLoading(true)
    setStreamingMessage('')

    try {
      const messages = [...chatMessages, userMessage].map(m => ({
        role: m.role,
        content: m.content
      }))

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deepseekApiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          stream: true
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Erro na API')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices[0]?.delta?.content || ''
              if (content) {
                fullContent += content
                setStreamingMessage(fullContent)
              }
            } catch (e) {
              // Ignora erros de parse em chunks incompletos
            }
          }
        }
      }

      if (fullContent) {
        addChatMessage({
          role: 'assistant',
          content: fullContent
        })
      }
    } catch (error) {
      addChatMessage({
        role: 'assistant',
        content: `Erro: ${error.message}`,
        error: true
      })
    } finally {
      setChatLoading(false)
      setStreamingMessage('')
    }
  }, [input, chatLoading, deepseekApiKey, chatMessages, addChatMessage, setChatLoading])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!chatOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
      onClick={closeChat}
    >
      <div 
        className="bg-card border border-border rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl animate-slideIn m-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold bg-[#00D4AA] text-white">
              AI
            </span>
            <span className="font-medium text-text">DeepSeek Chat</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={clearChat}
              className="p-2 text-muted hover:text-red-500 transition-colors"
              title="Limpar conversa"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={closeChat}
              className="p-2 text-muted hover:text-text transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.length === 0 && (
            <div className="text-center text-muted py-8">
              <p className="text-sm">Converse com o DeepSeek AI</p>
              <p className="text-xs mt-1 opacity-60">Pressione Enter para enviar</p>
            </div>
          )}
          
          {chatMessages.map((msg, i) => (
            <div 
              key={i} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-accent text-[#1a1a1a]' 
                    : msg.error
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-bg text-text'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="text-sm prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {streamingMessage && (
            <div className="flex justify-start">
              <div className="max-w-[80%] px-4 py-2 rounded-2xl bg-bg text-text">
                <div className="text-sm prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{streamingMessage}</ReactMarkdown>
                  <span className="animate-pulse">|</span>
                </div>
              </div>
            </div>
          )}
          
          {chatLoading && !streamingMessage && (
            <div className="flex justify-start">
              <div className="bg-bg px-4 py-2 rounded-2xl">
                <Loader2 size={18} className="animate-spin text-muted" />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <div className="p-4 border-t border-border">
          {!deepseekApiKey && (
            <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-500 text-xs">
              <AlertCircle size={14} />
              <span>Configure sua API key nas configurações</span>
            </div>
          )}
          
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              className="flex-1 px-4 py-2 bg-bg border border-border rounded-xl text-text placeholder-muted text-sm focus:border-accent transition-colors"
              disabled={chatLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || chatLoading}
              className="px-4 py-2 bg-accent text-[#1a1a1a] rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
