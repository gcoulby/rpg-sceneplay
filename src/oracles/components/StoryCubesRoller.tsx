import { useState } from 'react'
import { type IconType } from 'react-icons'
import * as gi from 'react-icons/gi'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

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
    <div className="flex flex-col gap-3 mb-4">
      {!compact && (
        <p className="text-muted-foreground text-xs">
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
        <Button
          size="lg"
          variant="secondary"
          className={`${compact ? 'w-full' : 'w-1/3'} `}
          onClick={() => generateCubes(3)}
        >
          Roll 3 {compact && 'Story Cubes'}
        </Button>
        {!compact && (
          <>
            <Button
              variant="secondary"
              size="lg"
              className="w-1/3"
              onClick={() => generateCubes(6)}
            >
              Roll 6
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="w-1/3"
              onClick={() => generateCubes(9)}
            >
              Roll 9
            </Button>
          </>
        )}
      </div>
      <div className="flex flex-wrap justify-center items-center gap-2">
        {cubes.map((cube, index) => (
          <div
            className="flex bg-slate-200 shadow-2xl p-2 border rounded-xl text-background"
            key={index}
          >
            <Tooltip>
              <TooltipTrigger>
                {cube({ size: compact ? 34 : 40 })}
              </TooltipTrigger>
              <TooltipContent className="shadow-2xl">
                <p>{cube.name.substring(2)}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        ))}
      </div>
      {compact && <Separator />}
    </div>
  )
}
