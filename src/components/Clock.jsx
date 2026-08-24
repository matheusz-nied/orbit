import { useState, useEffect } from 'react'

const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export default function Clock() {
  const [time, setTime] = useState(() => new Date())

  useEffect(() => {
    let timer = 0

    // setInterval de 1000ms acumula desvio e pode disparar duas vezes no
    // mesmo segundo (render desperdiçado). Aqui cada tick é agendado para o
    // início do próximo segundo real.
    const scheduleNextTick = () => {
      const now = new Date()
      timer = setTimeout(() => {
        setTime(new Date())
        scheduleNextTick()
      }, 1000 - now.getMilliseconds())
    }

    scheduleNextTick()
    return () => clearTimeout(timer)
  }, [])

  const dayName = days[time.getDay()]
  const day = time.getDate()
  const month = months[time.getMonth()]
  const year = time.getFullYear()
  
  const hours = String(time.getHours()).padStart(2, '0')
  const minutes = String(time.getMinutes()).padStart(2, '0')
  const seconds = String(time.getSeconds()).padStart(2, '0')

  return (
    <div className="orbit-clock text-center py-8 animate-fadeIn">
      <div className="text-6xl md:text-8xl font-light tracking-tight text-text mb-2 tabular-nums">
        {hours}<span className="opacity-50">:</span>{minutes}
        <span className="text-3xl md:text-5xl opacity-40 ml-1">{seconds}</span>
      </div>
      <div className="text-lg md:text-xl text-muted font-light">
        {dayName}, {day} de {month} de {year}
      </div>
    </div>
  )
}
