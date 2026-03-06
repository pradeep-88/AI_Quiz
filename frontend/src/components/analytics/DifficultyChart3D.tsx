import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { QuestionStat } from '../../types/quizTypes'

interface DifficultyChart3DProps {
  questionStats: QuestionStat[]
}

function Bars({ questionStats }: { questionStats: QuestionStat[] }) {
  const data = useMemo(() => {
    return questionStats
      .map((s) => ({
        difficulty: s.totalAttempts > 0 ? s.incorrectCount / s.totalAttempts : 0,
      }))
      .sort((a, b) => b.difficulty - a.difficulty)
  }, [questionStats])

  const maxH = Math.max(...data.map((d) => d.difficulty), 0.01)
  const spacing = 1.2
  const startX = -((data.length - 1) * spacing) / 2

  return (
    <group>
      {data.map((d, i) => {
        const h = (d.difficulty / maxH) * 2.5
        return (
          <mesh key={i} position={[startX + i * spacing, h / 2, 0]}>
            <boxGeometry args={[0.6, h, 0.6]} />
            <meshStandardMaterial
              color={d.difficulty > 0.5 ? '#ef4444' : d.difficulty > 0.25 ? '#f59e0b' : '#22c55e'}
              metalness={0.2}
              roughness={0.6}
            />
          </mesh>
        )
      })}
    </group>
  )
}

export function DifficultyChart3D({ questionStats }: DifficultyChart3DProps) {
  if (questionStats.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 rounded-lg bg-slate-800/50 border border-slate-700">
        No question data for 3D chart
      </div>
    )
  }

  return (
    <div className="h-64 w-full rounded-lg overflow-hidden bg-slate-900/50 border border-slate-700">
      <Canvas camera={{ position: [0, 2, 8], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Bars questionStats={questionStats} />
        <OrbitControls enableZoom enablePan />
      </Canvas>
    </div>
  )
}
