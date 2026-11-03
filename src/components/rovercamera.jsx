
import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

function RoverCamera({ roverRef, cameraMode }) {
  const { camera } = useThree()

  const cameraPosition = useRef(new THREE.Vector3())
  const lookTarget = useRef(new THREE.Vector3())

  useEffect(() => {
    if (cameraMode === 'third') {
      camera.position.set(0, 22, 35)
      camera.lookAt(0, 0, 0)
    }
  }, [cameraMode, camera])

  useFrame(() => {
    if (!roverRef.current || cameraMode !== 'pov') return

    cameraPosition.current.set(0, 2.92, 0.2)
    lookTarget.current.set(0, 2.92, 12)

    roverRef.current.localToWorld(cameraPosition.current)
    roverRef.current.localToWorld(lookTarget.current)

    camera.position.copy(cameraPosition.current)
    camera.lookAt(lookTarget.current)
  })

  return null
}

export default RoverCamera


