export type OutfitPanelMaterial = 'shirt' | 'accent' | 'secondary'

export type OutfitPanel = {
  id: string
  position: [number, number, number]
  size: [number, number, number]
  material: OutfitPanelMaterial
}

export const shadowOracleRearPanels: OutfitPanel[] = [
  {
    id: 'jacket-back',
    position: [0, 1.05, -0.215],
    size: [0.82, 0.94, 0.05],
    material: 'accent',
  },
  {
    id: 'jacket-back-collar',
    position: [0, 1.47, -0.246],
    size: [0.58, 0.08, 0.035],
    material: 'secondary',
  },
  {
    id: 'jacket-back-seam',
    position: [0, 1.06, -0.246],
    size: [0.035, 0.72, 0.035],
    material: 'secondary',
  },
  {
    id: 'jacket-back-hem',
    position: [0, 0.62, -0.246],
    size: [0.72, 0.06, 0.035],
    material: 'secondary',
  },
  {
    id: 'jacket-left-side',
    position: [-0.415, 1.05, 0],
    size: [0.05, 0.9, 0.38],
    material: 'accent',
  },
  {
    id: 'jacket-right-side',
    position: [0.415, 1.05, 0],
    size: [0.05, 0.9, 0.38],
    material: 'accent',
  },
]
