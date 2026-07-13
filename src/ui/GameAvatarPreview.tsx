import { Canvas, useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { BlockAvatar } from '../game/GameScene'
import type { AvatarSettings, PlayerEmote } from '../game/types'

type GameAvatarPreviewProps = {
  avatar: AvatarSettings
  pose?: PlayerEmote
  className?: string
}

export function GameAvatarPreview({ avatar, pose = 'none', className }: GameAvatarPreviewProps) {
  const emote = pose === 'none' ? 'none' : pose

  return (
    <Canvas
      className={className ?? 'bb-game-avatar-preview'}
      camera={{ position: [0, 0.72, 5.7], fov: 34 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      shadows={false}
    >
      <ambientLight intensity={1.05} />
      <directionalLight position={[3, 5, 4]} intensity={1.35} />
      <directionalLight position={[-3, 3, 2]} intensity={0.45} />
      <PreviewCamera />
      <group position={[0, -0.42, 0]} rotation={[0, -0.2, 0]} scale={1.12}>
        <BlockAvatar
          bodyColor={avatar.bodyColor}
          shirtColor={avatar.shirtColor}
          hairColor={avatar.hairColor}
          hairStyle={avatar.hairStyle}
          pantsColor={avatar.pantsColor}
          eyeColor={avatar.eyeColor}
          accentColor={avatar.accentColor}
          secondaryColor={avatar.secondaryColor}
          outfitStyle={avatar.outfitStyle}
          bottomStyle={avatar.bottomStyle}
          shoeStyle={avatar.shoeStyle}
          shoeColor={avatar.shoeColor}
          accessory={avatar.accessory}
          face={avatar.face}
          username=""
          showName={false}
          hat={avatar.hat !== 'none'}
          emote={emote}
          action="idle"
        />
      </group>
    </Canvas>
  )
}

function PreviewCamera() {
  const camera = useThree((state) => state.camera)

  useEffect(() => {
    camera.lookAt(0, 0.22, 0)
  }, [camera])

  return null
}
