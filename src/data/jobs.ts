import type {
  JobDefinition,
  JobId,
  JobRuntime,
  LocationId,
  Vec3,
} from '../game/types'

export type WorkplaceBuilding = {
  id: string
  label: string
  locationId: LocationId
  position: Vec3
  size: Vec3
  color: string
}

export const workDistrictCenter: Vec3 = [90, 0, 100]
export const workDistrictSize: Vec3 = [38, 0.16, 48]

export const workplaceBuildings: WorkplaceBuilding[] = [
  {
    id: 'buddy-market',
    label: 'Buddy Market',
    locationId: 'market',
    position: [82, 2.4, 88],
    size: [10, 4.8, 8],
    color: '#0ea5e9',
  },
  {
    id: 'sunny-bites',
    label: 'Sunny Bites',
    locationId: 'restaurant',
    position: [98, 2.4, 88],
    size: [10, 4.8, 8],
    color: '#f97316',
  },
  {
    id: 'buddy-delivery-depot',
    label: 'Buddy Delivery',
    locationId: 'delivery',
    position: [82, 2.4, 112],
    size: [10, 4.8, 8],
    color: '#8b5cf6',
  },
  {
    id: 'sunshine-farm-barn',
    label: 'Sunshine Farm',
    locationId: 'farm',
    position: [98, 2.2, 112],
    size: [9, 4.4, 7],
    color: '#16a34a',
  },
]

export const jobDefinitions: JobDefinition[] = [
  {
    id: 'shopkeeper',
    title: 'Shopkeeper Shift',
    employer: 'Buddy Market',
    description: 'Stock products, scan a basket, and help a customer.',
    locationId: 'market',
    reward: 24,
    color: '#0ea5e9',
    managerName: 'Mia Market',
    managerPosition: [82, 0, 93.4],
    tasks: [
      {
        id: 'market-stock',
        label: 'Stock shelves',
        instruction: 'Put the delivery boxes onto the market shelves.',
        position: [78.5, 0, 94.5],
        npcLine: 'Nice stocking! The shelves look full.',
      },
      {
        id: 'market-scan',
        label: 'Scan basket',
        instruction: 'Scan the customer basket at the checkout.',
        position: [82, 0, 94.5],
        npcLine: 'Beep! Everything is scanned correctly.',
      },
      {
        id: 'market-customer',
        label: 'Help customer',
        instruction: 'Hand the shopping bag to the waiting customer.',
        position: [85.5, 0, 94.5],
        npcLine: 'Thank you! That was friendly service.',
      },
    ],
  },
  {
    id: 'restaurant',
    title: 'Restaurant Shift',
    employer: 'Sunny Bites',
    description: 'Prepare, cook, and serve a meal to a hungry buddy.',
    locationId: 'restaurant',
    reward: 28,
    color: '#f97316',
    managerName: 'Chef Coco',
    managerPosition: [98, 0, 93.4],
    tasks: [
      {
        id: 'restaurant-prep',
        label: 'Prepare meal',
        instruction: 'Collect the ingredients and prepare the meal.',
        position: [94.5, 0, 94.5],
        npcLine: 'Great prep! The ingredients are ready.',
      },
      {
        id: 'restaurant-cook',
        label: 'Cook meal',
        instruction: 'Cook the prepared meal at the kitchen station.',
        position: [98, 0, 94.5],
        npcLine: 'Perfect cooking! It smells delicious.',
      },
      {
        id: 'restaurant-serve',
        label: 'Serve customer',
        instruction: 'Take the finished meal to the restaurant customer.',
        position: [101.5, 0, 94.5],
        npcLine: 'Yum! The customer loved their meal.',
      },
    ],
  },
  {
    id: 'delivery',
    title: 'Delivery Shift',
    employer: 'Buddy Delivery',
    description: 'Collect, load, and deliver a parcel across the district.',
    locationId: 'delivery',
    reward: 32,
    color: '#8b5cf6',
    managerName: 'Dex Dispatch',
    managerPosition: [82, 0, 117.4],
    tasks: [
      {
        id: 'delivery-collect',
        label: 'Collect parcel',
        instruction: 'Collect the labelled parcel from the depot counter.',
        position: [78.5, 0, 118.5],
        npcLine: 'Parcel collected. Check the address label!',
      },
      {
        id: 'delivery-load',
        label: 'Load parcel',
        instruction: 'Load the parcel onto the delivery trolley.',
        position: [82, 0, 118.5],
        npcLine: 'Parcel secured. Follow the marker to the customer.',
      },
      {
        id: 'delivery-customer',
        label: 'Deliver parcel',
        instruction: 'Bring the parcel to the customer by the east gate.',
        position: [106, 0, 116],
        npcLine: 'Delivery received! Right on time.',
      },
    ],
  },
  {
    id: 'farming',
    title: 'Farming Shift',
    employer: 'Sunshine Farm',
    description: 'Plant seeds, water crops, and harvest fresh produce.',
    locationId: 'farm',
    reward: 26,
    color: '#16a34a',
    managerName: 'Farmer Fern',
    managerPosition: [98, 0, 117.4],
    tasks: [
      {
        id: 'farm-plant',
        label: 'Plant seeds',
        instruction: 'Plant a neat row of seeds in the first field.',
        position: [94.5, 0, 121],
        npcLine: 'Those seeds are planted in a perfect row.',
      },
      {
        id: 'farm-water',
        label: 'Water crops',
        instruction: 'Water the growing plants in the middle field.',
        position: [98, 0, 121],
        npcLine: 'The crops have all the water they need.',
      },
      {
        id: 'farm-harvest',
        label: 'Harvest produce',
        instruction: 'Harvest the ripe vegetables from the final field.',
        position: [101.5, 0, 121],
        npcLine: 'Fresh harvest ready for Buddy Market!',
      },
    ],
  },
]

const jobById = new Map(jobDefinitions.map((job) => [job.id, job]))

export function getJobDefinition(id: JobId) {
  return jobById.get(id) ?? jobDefinitions[0]
}

export function activeJobTask(runtime: JobRuntime) {
  if (!runtime.activeId || runtime.status !== 'running') return undefined
  return getJobDefinition(runtime.activeId).tasks[runtime.taskIndex]
}

export function jobForLocation(locationId: LocationId) {
  return jobDefinitions.find((job) => job.locationId === locationId)
}
