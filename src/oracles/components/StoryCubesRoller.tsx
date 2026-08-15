import { useState } from 'react'
import type { IconType } from 'react-icons'
import * as gi from 'react-icons/gi'
import { Button } from '@/components/ui/button'

const GLYPHS = Object.values(gi)

interface StoryCubesRollerProps {
  compact?: boolean
}

export default function StoryCubesRoller({ compact }: StoryCubesRollerProps) {
  const [cubes, setCubes] = useState<IconType[]>([])

  const generateCubes = (count: number) => {
    const c: IconType[] = []
    for (let i = 0; i < count; i++) {
      c.push(GLYPHS[Math.floor(Math.random() * GLYPHS.length)])
    }
    setCubes(c)
  }

  return (
    <div className="flex flex-col gap-3">
      {!compact && (
        <p className="text-xs text-muted-foreground">
          Inspired by{' '}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://www.storycubes.com/en/"
            className="underline italic"
          >
            Rory's Story Cubes
          </a>
          , icons from{' '}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://game-icons.net"
            className="underline italic"
          >
            Game-Icons.net
          </a>
        </p>
      )}
      <div className="flex flex-row justify-center items-center gap-2">
        <Button size={compact ? 'sm' : 'default'} onClick={() => generateCubes(3)}>
          Roll 3
        </Button>
        {!compact && (
          <>
            <Button onClick={() => generateCubes(6)}>Roll 6</Button>
            <Button onClick={() => generateCubes(9)}>Roll 9</Button>
          </>
        )}
      </div>
      <div className="flex flex-wrap justify-center items-center gap-2">
        {cubes.map((cube, index) => (
          <div
            className="flex bg-foreground p-3 border rounded-xl text-background"
            key={index}
          >
            {cube({ size: compact ? 24 : 40 })}
          </div>
        ))}
      </div>
    </div>
  )
}
