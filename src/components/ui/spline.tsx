
'use client'

import { Suspense, lazy, useState } from 'react'
const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-yellow-600/20 rounded-lg">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">🎨</span>
          </div>
          <p className="text-neutral-300">3D Gallery Preview</p>
        </div>
      </div>
    )
  }

  return (
    <Suspense 
      fallback={
        <div className="w-full h-full flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <span className="loader"></span>
            <p className="text-neutral-400 mt-4">Loading 3D Scene...</p>
          </div>
        </div>
      }
    >
      <Spline
        scene={scene}
        className={className}
        onError={() => setHasError(true)}
      />
    </Suspense>
  )
}
