import { Button } from '@/components/ui/button'
import { useState } from 'react'
import type { IconType } from 'react-icons'

import * as gi from 'react-icons/gi'

const GLYPHS = Object.values(gi)

const StoryCubes = () => {
  const [cubes, setCubes] = useState<IconType[]>([])

  const generateCubes = (count: number) => {
    const c: IconType[] = []

    for (let i = 0; i < count; i++) {
      c.push(GLYPHS[Math.floor(Math.random() * GLYPHS.length)])
    }
    setCubes(c)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col items-center px-3.5 py-2 border-b border-(--fd-border) shrink-0 gap-2">
        <span className="font-bold text-[13px] uppercase tracking-[0.5px] text-(--fd-text)">
          Story Inspiration Dice
        </span>
        <div className="flex flex-wrap justify-center items-center gap-3 text-muted-foreground">
          <p className="text-xs">
            This tool is inspired by{' '}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.storycubes.com/en/"
              className="underline italic"
            >
              Rory's Story Cubes
            </a>{' '}
            and uses icons from{' '}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://game-icons.net"
              className="underline italic"
            >
              Game-Icons.net
            </a>
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-10 mt-10 p-4">
        {/* <h1 className="font-bold text-center">Story Inspiration Dice</h1> */}
        <div className="flex flex-row justify-center items-center gap-3">
          <Button onClick={() => generateCubes(3)}>Roll 3</Button>
          <Button onClick={() => generateCubes(6)}>Roll 6</Button>
          <Button onClick={() => generateCubes(9)}>Roll 9</Button>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-3">
          {cubes.map((cube, index) => (
            <div
              className="flex bg-foreground p-4 border rounded-2xl text-background"
              key={index}
            >
              <div className="flex">{cube({ size: 40 })}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default StoryCubes
