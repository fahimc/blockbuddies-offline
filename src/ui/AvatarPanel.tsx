import {
  ArrowLeft,
  BadgePlus,
  Check,
  ChevronRight,
  CircleDollarSign,
  Dice5,
  Footprints,
  Glasses,
  Grid2X2,
  Hand,
  Laugh,
  Music,
  Palette,
  RotateCw,
  Shirt,
  Sparkles,
  UserRound,
} from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { useMemo, useState } from 'react'
import {
  accentColors,
  accessoryItems,
  allCustomizationItems,
  clothingItems,
  customizationSteps,
  emoteItems,
  eyeColors,
  faceStyles,
  hairColors,
  hairStyles,
  skinTones,
  trailItems,
  type CustomizationItem,
  type CustomizationStepId,
} from '../data/avatarCustomization'
import type { AvatarSettings } from '../game/types'
import { useGameStore } from '../state/gameStore'

const stepOrder: CustomizationStepId[] = ['hub', 'body', 'clothing', 'accessories', 'emotes', 'trails']
const clothingTabs = ['Tops', 'Hoodies', 'Shirts', 'Pants', 'Overalls', 'Shoes']
const accessoryTabs = ['All', 'Hats', 'Glasses', 'Headphones', 'Backpacks', 'Pets', 'Effects']
const emoteTabs = ['All', 'Dances', 'Gestures', 'Sits', 'Actions']
type BodySectionId = 'body' | 'hair' | 'face' | 'colours'

const bodySections: { id: BodySectionId; label: string; icon: ReactNode }[] = [
  { id: 'body', label: 'Body & Style', icon: <UserRound size={28} aria-hidden /> },
  { id: 'hair', label: 'Hair', icon: <Sparkles size={28} aria-hidden /> },
  { id: 'face', label: 'Face', icon: <Laugh size={28} aria-hidden /> },
  { id: 'colours', label: 'Colours', icon: <Palette size={28} aria-hidden /> },
]

type AvatarPanelProps = {
  onBack?: () => void
  onComplete?: () => void
}

export function AvatarPanel({ onBack, onComplete }: AvatarPanelProps = {}) {
  const [step, setStep] = useState<CustomizationStepId>('hub')
  const [bodySection, setBodySection] = useState<BodySectionId>('body')
  const avatar = useGameStore((state) => state.avatar)
  const coins = useGameStore((state) => state.coins)
  const unlocked = useGameStore((state) => state.unlockedItems)
  const setOpenPanel = useGameStore((state) => state.setOpenPanel)
  const updateAvatar = useGameStore((state) => state.updateAvatar)
  const selectCustomizationItem = useGameStore((state) => state.selectCustomizationItem)
  const stepIndex = stepOrder.indexOf(step)
  const stepInfo = customizationSteps[stepIndex]
  const ownedCount = allCustomizationItems.filter((item) => !item.shopItemId || unlocked.includes(item.shopItemId)).length

  const selectItem = (item: CustomizationItem) => selectCustomizationItem(item)
  const next = () => {
    if (stepIndex >= stepOrder.length - 1) {
      if (onComplete) {
        onComplete()
      } else {
        setOpenPanel(undefined)
      }
      return
    }
    setStep(stepOrder[stepIndex + 1])
  }
  const previous = () => {
    if (step === 'hub') {
      if (onBack) {
        onBack()
      } else {
        setOpenPanel(undefined)
      }
      return
    }
    setStep(stepOrder[Math.max(0, stepIndex - 1)])
  }
  const randomize = () => {
    const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)]
    updateAvatar({
      bodyColor: pick(skinTones),
      hairColor: pick(hairColors),
      eyeColor: pick(eyeColors),
      accentColor: pick(accentColors),
      shirtColor: pick(clothingItems).color ?? '#0b74ff',
      pantsColor: pick(['#111827', '#1d4ed8', '#374151']),
      hairStyle: pick(['spiky', 'side', 'curly', 'long', 'flat'] as const),
      face: pick(['smile', 'happy', 'wink', 'wow', 'cool'] as const),
    })
  }

  return (
    <section className="bb-customizer absolute inset-0 z-50 overflow-hidden text-white">
      <div className="bb-customizer-bg" aria-hidden>
        <div className="bb-town-skyline" />
      </div>
      <header className="bb-customizer-topbar">
        <button type="button" className="bb-customizer-back" onClick={previous} aria-label="Back">
          <ArrowLeft size={30} aria-hidden />
        </button>
        <h2>{stepInfo.title}</h2>
        <div className="bb-customizer-wallet">
          <span className="bb-coin-pill">
            <CircleDollarSign size={19} aria-hidden />
            {coins.toLocaleString()}
            <BadgePlus size={21} aria-hidden />
          </span>
          <span className="bb-level-badge">Lv. 4</span>
        </div>
      </header>

      <div className="bb-step-meta">
        <span>Step {stepIndex + 1} of 6</span>
        <div className="bb-step-dots" aria-hidden>
          {stepOrder.map((entry) => (
            <button
              key={entry}
              type="button"
              onClick={() => setStep(entry)}
              className={entry === step ? 'active' : ''}
              aria-label={`Open ${entry}`}
            />
          ))}
        </div>
      </div>

      <main className={`bb-customizer-main bb-customizer-${step}`}>
        {step === 'hub' ? <HubStep avatar={avatar} onStep={setStep} onBodySection={setBodySection} /> : null}
        {step === 'body' ? (
          <BodyStep
            avatar={avatar}
            activeSection={bodySection}
            onSection={setBodySection}
            updateAvatar={updateAvatar}
          />
        ) : null}
        {step === 'clothing' ? <ClothingStep avatar={avatar} onRandomize={randomize} onSelect={selectItem} /> : null}
        {step === 'accessories' ? (
          <AccessoriesStep avatar={avatar} ownedCount={ownedCount} onSelect={selectItem} unlocked={unlocked} />
        ) : null}
        {step === 'emotes' ? <EmotesStep avatar={avatar} onSelect={selectItem} /> : null}
        {step === 'trails' ? <TrailsStep avatar={avatar} onSelect={selectItem} unlocked={unlocked} /> : null}
      </main>

      <footer className="bb-customizer-footer">
        <button type="button" className="bb-customizer-cta" onClick={next}>
          <span>{stepInfo.cta}</span>
          <ChevronRight size={42} aria-hidden />
        </button>
        <button type="button" className="bb-customizer-note" onClick={next}>
          <Sparkles size={24} aria-hidden />
          <span>{stepInfo.note}</span>
          <ChevronRight size={24} aria-hidden />
        </button>
      </footer>
    </section>
  )
}

function HubStep({
  avatar,
  onStep,
  onBodySection,
}: {
  avatar: AvatarSettings
  onStep: (step: CustomizationStepId) => void
  onBodySection: (section: BodySectionId) => void
}) {
  const openBody = (section: BodySectionId) => {
    onBodySection(section)
    onStep('body')
  }

  return (
    <>
      <div className="bb-hub-rail left">
        <HubButton label="Skin" icon={<UserRound size={31} />} onClick={() => openBody('body')} />
        <HubButton label="Hair" icon={<Sparkles size={31} />} onClick={() => openBody('hair')} />
        <HubButton label="Face" icon={<Laugh size={31} />} onClick={() => openBody('face')} />
        <HubButton label="Tops" icon={<Shirt size={31} />} onClick={() => onStep('clothing')} />
        <HubButton label="Bottoms" icon={<Footprints size={31} />} onClick={() => onStep('clothing')} />
      </div>
      <div className="bb-hub-stage">
        <AvatarStage avatar={avatar} size="large" />
      </div>
      <div className="bb-hub-rail right">
        <HubButton label="Hats" icon={<BadgePlus size={31} />} onClick={() => onStep('accessories')} />
        <HubButton label="Accessories" icon={<Glasses size={31} />} onClick={() => onStep('accessories')} />
        <HubButton label="Emotes" icon={<Laugh size={31} />} onClick={() => onStep('emotes')} />
        <HubButton label="Trails" icon={<Sparkles size={31} />} onClick={() => onStep('trails')} />
      </div>
    </>
  )
}

function BodyStep({
  avatar,
  activeSection,
  onSection,
  updateAvatar,
}: {
  avatar: AvatarSettings
  activeSection: BodySectionId
  onSection: (section: BodySectionId) => void
  updateAvatar: (avatar: Partial<AvatarSettings>) => void
}) {
  return (
    <>
      <BodySectionRail activeSection={activeSection} onSection={onSection} />
      <div className="bb-body-stage">
        <AvatarStage avatar={avatar} size="large" />
      </div>
      <div className={`bb-body-controls bb-body-controls-${activeSection}`}>
        {activeSection === 'body' ? (
          <>
            <PalettePanel
              title="Skin Tone"
              colors={skinTones}
              active={avatar.bodyColor}
              onPick={(bodyColor) => updateAvatar({ bodyColor })}
            />
            <PalettePanel
              title="Hair Colour"
              colors={hairColors}
              active={avatar.hairColor ?? hairColors[0]}
              onPick={(hairColor) => updateAvatar({ hairColor })}
            />
            <PalettePanel
              title="Eye Colour"
              colors={eyeColors}
              active={avatar.eyeColor ?? eyeColors[0]}
              onPick={(eyeColor) => updateAvatar({ eyeColor })}
            />
            <PalettePanel
              title="Accent Colour"
              colors={accentColors}
              active={avatar.accentColor ?? accentColors[0]}
              onPick={(accentColor) => updateAvatar({ accentColor })}
            />
            <MiniStrip
              title="Hair Style"
              items={hairStyles}
              active={avatar.hairStyle ?? 'spiky'}
              onPick={(patch) => updateAvatar(patch)}
            />
            <MiniStrip
              title="Face Expression"
              items={faceStyles}
              active={avatar.face ?? 'smile'}
              onPick={(patch) => updateAvatar(patch)}
            />
          </>
        ) : null}
        {activeSection === 'hair' ? (
          <>
            <PalettePanel
              title="Hair Colour"
              colors={hairColors}
              active={avatar.hairColor ?? hairColors[0]}
              onPick={(hairColor) => updateAvatar({ hairColor })}
            />
            <MiniStrip
              title="Hair Style"
              items={hairStyles}
              active={avatar.hairStyle ?? 'spiky'}
              onPick={(patch) => updateAvatar(patch)}
            />
          </>
        ) : null}
        {activeSection === 'face' ? (
          <>
            <PalettePanel
              title="Eye Colour"
              colors={eyeColors}
              active={avatar.eyeColor ?? eyeColors[0]}
              onPick={(eyeColor) => updateAvatar({ eyeColor })}
            />
            <MiniStrip
              title="Face Expression"
              items={faceStyles}
              active={avatar.face ?? 'smile'}
              onPick={(patch) => updateAvatar(patch)}
            />
          </>
        ) : null}
        {activeSection === 'colours' ? (
          <>
            <PalettePanel
              title="Skin Tone"
              colors={skinTones}
              active={avatar.bodyColor}
              onPick={(bodyColor) => updateAvatar({ bodyColor })}
            />
            <PalettePanel
              title="Hair Colour"
              colors={hairColors}
              active={avatar.hairColor ?? hairColors[0]}
              onPick={(hairColor) => updateAvatar({ hairColor })}
            />
            <PalettePanel
              title="Eye Colour"
              colors={eyeColors}
              active={avatar.eyeColor ?? eyeColors[0]}
              onPick={(eyeColor) => updateAvatar({ eyeColor })}
            />
            <PalettePanel
              title="Accent Colour"
              colors={accentColors}
              active={avatar.accentColor ?? accentColors[0]}
              onPick={(accentColor) => updateAvatar({ accentColor })}
            />
          </>
        ) : null}
      </div>
    </>
  )
}

function BodySectionRail({
  activeSection,
  onSection,
}: {
  activeSection: BodySectionId
  onSection: (section: BodySectionId) => void
}) {
  return (
    <nav className="bb-custom-side-rail bb-body-section-rail" aria-label="Body customisation sections">
      {bodySections.map((section) => (
        <button
          type="button"
          key={section.id}
          className={section.id === activeSection ? 'active' : ''}
          onClick={() => onSection(section.id)}
          aria-pressed={section.id === activeSection}
        >
          {section.icon}
          <span>{section.label}</span>
        </button>
      ))}
    </nav>
  )
}

function ClothingStep({
  avatar,
  onRandomize,
  onSelect,
}: {
  avatar: AvatarSettings
  onRandomize: () => void
  onSelect: (item: CustomizationItem) => void
}) {
  return (
    <>
      <button type="button" className="bb-floating-tool left one">
        <UserRound size={28} aria-hidden />
        Preview
      </button>
      <button type="button" className="bb-floating-tool left two" onClick={onRandomize}>
        <Dice5 size={28} aria-hidden />
        Randomize
      </button>
      <button type="button" className="bb-floating-tool right one">
        <Palette size={28} aria-hidden />
        Color
      </button>
      <div className="bb-clothing-stage">
        <AvatarStage avatar={avatar} size="medium" />
      </div>
      <CatalogPanel tabs={clothingTabs} items={clothingItems} avatar={avatar} onSelect={onSelect} />
    </>
  )
}

function AccessoriesStep({
  avatar,
  ownedCount,
  onSelect,
  unlocked,
}: {
  avatar: AvatarSettings
  ownedCount: number
  onSelect: (item: CustomizationItem) => void
  unlocked: string[]
}) {
  return (
    <>
      <div className="bb-accessory-stage">
        <AvatarStage avatar={avatar} size="small" />
      </div>
      <div className="bb-style-card">
        <div>
          <Sparkles size={28} aria-hidden />
          <span>Style Points</span>
          <strong>350</strong>
        </div>
        <div>
          <Laugh size={28} aria-hidden />
          <span>Collection</span>
          <strong>{ownedCount} / {allCustomizationItems.length}</strong>
        </div>
      </div>
      <CatalogPanel tabs={accessoryTabs} items={accessoryItems} avatar={avatar} onSelect={onSelect} unlocked={unlocked} dense />
    </>
  )
}

function EmotesStep({ avatar, onSelect }: { avatar: AvatarSettings; onSelect: (item: CustomizationItem) => void }) {
  const previewItems = useMemo(() => emoteItems.slice(0, 5), [])
  return (
    <>
      <SideRail
        items={[
          ['All', <Grid2X2 size={27} key="all" />],
          ['Dances', <Music size={27} key="music" />],
          ['Gestures', <Hand size={27} key="hand" />],
          ['Sits', <UserRound size={27} key="sit" />],
          ['Actions', <Footprints size={27} key="act" />],
        ]}
      />
      <div className="bb-emote-preview">
        <AvatarStage avatar={avatar} size="small" pose="wave" />
        <div className="bb-preview-label">Preview<br />Wave</div>
      </div>
      <CatalogPanel tabs={emoteTabs} items={emoteItems} avatar={avatar} onSelect={onSelect} className="emote-grid" />
      <div className="bb-quick-preview">
        <strong>Quick Preview</strong>
        <div>
          {previewItems.map((item) => (
            <button type="button" key={item.id} onClick={() => onSelect(item)} aria-label={`Preview ${item.name}`}>
              <MiniAvatar avatar={avatar} pose={item.emote ?? 'wave'} />
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

function TrailsStep({
  avatar,
  onSelect,
  unlocked,
}: {
  avatar: AvatarSettings
  onSelect: (item: CustomizationItem) => void
  unlocked: string[]
}) {
  return (
    <>
      <div className="bb-trail-stage">
        <AvatarStage avatar={avatar} size="medium" showTrail />
      </div>
      <CatalogPanel tabs={['All', 'Rainbow', 'Neon', 'Galaxy', 'Stars']} items={trailItems} avatar={avatar} onSelect={onSelect} unlocked={unlocked} />
    </>
  )
}

function HubButton({ label, icon, onClick }: { label: string; icon: ReactNode; onClick: () => void }) {
  return (
    <button type="button" className="bb-hub-button" onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  )
}

function SideRail({ items }: { items: [string, ReactNode][] }) {
  return (
    <nav className="bb-custom-side-rail">
      {items.map(([label, icon], index) => (
        <button type="button" key={label} className={index === 0 ? 'active' : ''}>
          {icon}
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}

function PalettePanel({
  title,
  colors,
  active,
  onPick,
}: {
  title: string
  colors: string[]
  active: string
  onPick: (color: string) => void
}) {
  return (
    <section className="bb-palette-panel">
      <h3>{title}</h3>
      <div>
        {colors.map((color) => (
          <button
            type="button"
            key={color}
            onClick={() => onPick(color)}
            className={color === active ? 'active' : ''}
            style={{ background: color }}
            aria-label={`${title} ${color}`}
          />
        ))}
      </div>
    </section>
  )
}

function MiniStrip({
  title,
  items,
  active,
  onPick,
}: {
  title: string
  items: { id: string; name: string; patch: Partial<AvatarSettings> }[]
  active: string
  onPick: (patch: Partial<AvatarSettings>) => void
}) {
  return (
    <section className="bb-mini-strip">
      <h3>{title}</h3>
      <div>
        {items.map((item) => (
          <button type="button" key={item.id} className={item.id === active ? 'active' : ''} onClick={() => onPick(item.patch)}>
            {item.name.slice(0, 2)}
          </button>
        ))}
      </div>
    </section>
  )
}

function CatalogPanel({
  tabs,
  items,
  avatar,
  onSelect,
  unlocked = [],
  dense = false,
  className = '',
}: {
  tabs: string[]
  items: CustomizationItem[]
  avatar: AvatarSettings
  onSelect: (item: CustomizationItem) => void
  unlocked?: string[]
  dense?: boolean
  className?: string
}) {
  return (
    <section className={`bb-custom-catalog ${dense ? 'dense' : ''} ${className}`}>
      <div className="bb-custom-tabs">
        {tabs.map((tab, index) => (
          <button type="button" key={tab} className={index === 0 ? 'active' : ''}>
            {tab}
          </button>
        ))}
      </div>
      <div className="bb-custom-grid">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            avatar={avatar}
            owned={!item.shopItemId || item.cost === 0 || unlocked.includes(item.shopItemId)}
            equipped={isEquipped(avatar, item)}
            onSelect={() => onSelect(item)}
          />
        ))}
      </div>
    </section>
  )
}

function ItemCard({
  item,
  avatar,
  owned,
  equipped,
  onSelect,
}: {
  item: CustomizationItem
  avatar: AvatarSettings
  owned: boolean
  equipped: boolean
  onSelect: () => void
}) {
  return (
    <button type="button" className={`bb-custom-item ${equipped ? 'equipped' : ''}`} onClick={onSelect}>
      {equipped ? (
        <span className="bb-equipped-check">
          <Check size={18} aria-hidden />
        </span>
      ) : null}
      <ItemPreview item={item} avatar={avatar} />
      <strong>{item.name}</strong>
      <span className={`rarity ${item.rarity.toLowerCase()}`}>{item.rarity}</span>
      <span className={owned ? 'price owned' : 'price'}>
        {equipped ? 'Equipped' : item.cost === 0 ? 'Free' : `${item.cost}`}
      </span>
    </button>
  )
}

function ItemPreview({ item, avatar }: { item: CustomizationItem; avatar: AvatarSettings }) {
  if (item.kind === 'emote') return <MiniAvatar avatar={avatar} pose={item.emote ?? 'wave'} />
  if (item.kind === 'top') return <span className="bb-item-top" style={{ '--item-color': item.color, '--item-accent': item.accent ?? '#ffffff' } as CSSProperties} />
  if (item.kind === 'pants') return <span className="bb-item-pants" style={{ '--item-color': item.color } as CSSProperties} />
  if (item.kind === 'trail') return <span className="bb-item-trail" style={{ '--item-color': item.color, '--item-accent': item.accent ?? '#ffffff' } as CSSProperties} />
  return <span className={`bb-item-accessory ${item.kind}`} style={{ '--item-color': item.color, '--item-accent': item.accent ?? '#ffffff' } as CSSProperties} />
}

function isEquipped(avatar: AvatarSettings, item: CustomizationItem) {
  return Object.entries(item.patch).every(([key, value]) => avatar[key as keyof AvatarSettings] === value)
}

function AvatarStage({
  avatar,
  size,
  pose = 'idle',
  showTrail = false,
}: {
  avatar: AvatarSettings
  size: 'small' | 'medium' | 'large'
  pose?: 'idle' | 'wave' | 'dance' | 'cheer' | 'sit'
  showTrail?: boolean
}) {
  return (
    <div className={`bb-avatar-stage ${size}`}>
      <div className="bb-stage-glow" />
      <div className="bb-avatar-turntable">
        {showTrail ? <span className="bb-avatar-trail" /> : null}
        <MiniAvatar avatar={avatar} pose={pose} />
      </div>
      <button type="button" className="bb-avatar-rotate" aria-label="Rotate avatar">
        <RotateCw size={30} aria-hidden />
      </button>
    </div>
  )
}

function MiniAvatar({ avatar, pose = 'idle' }: { avatar: AvatarSettings; pose?: string }) {
  return (
    <span
      className={`bb-mini-avatar pose-${pose} hair-${avatar.hairStyle ?? 'spiky'} face-${avatar.face ?? 'smile'}`}
      style={
        {
          '--skin': avatar.bodyColor,
          '--shirt': avatar.shirtColor,
          '--hair': avatar.hairColor ?? '#5a2f16',
          '--pants': avatar.pantsColor ?? '#111827',
          '--accent': avatar.accentColor ?? '#0b74ff',
          '--eyes': avatar.eyeColor ?? '#111827',
        } as CSSProperties
      }
      aria-hidden
    >
      <span className="hair" />
      <span className="head">
        <span className="eye left" />
        <span className="eye right" />
        <span className="mouth" />
      </span>
      <span className="body" />
      <span className="arm left" />
      <span className="arm right" />
      <span className="leg left" />
      <span className="leg right" />
      {avatar.hat !== 'none' ? <span className="hat" /> : null}
      {avatar.accessory && avatar.accessory !== 'none' ? <span className="glasses" /> : null}
    </span>
  )
}
