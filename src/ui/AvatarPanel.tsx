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
  Save,
  Shirt,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
} from 'lucide-react'
import type { CSSProperties, PointerEvent, ReactNode } from 'react'
import { useMemo, useRef, useState } from 'react'
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
  heroSkinItems,
  pantsItems,
  skinTones,
  trailItems,
  type CustomizationItem,
  type CustomizationStepId,
} from '../data/avatarCustomization'
import {
  brickAvatarPresets,
  brickBottomStyles,
  brickOutfitStyles,
  brickShoeStyles,
  mapBlockSkinProject,
  presetToAvatar,
} from '../data/brickAvatar'
import type {
  AvatarSettings,
  PlayerEmote,
  SavedAvatarStyle,
} from '../game/types'
import { useGameStore } from '../state/gameStore'
import { GameAvatarPreview } from './GameAvatarPreview'

const stepOrder: CustomizationStepId[] = [
  'hub',
  'body',
  'clothing',
  'accessories',
  'emotes',
  'trails',
]
const clothingTabs = [
  'Hero Skins',
  'Tops',
  'Hoodies',
  'Shirts',
  'Pants',
  'Shoes',
]
const accessoryTabs = [
  'All',
  'Hats',
  'Glasses',
  'Headphones',
  'Backpacks',
  'Pets',
  'Effects',
]
const emoteTabs = ['All', 'Dances', 'Gestures', 'Sits', 'Actions']
type BodySectionId = 'body' | 'hair' | 'face' | 'colours' | 'wardrobe'

const bodySections: { id: BodySectionId; label: string; icon: ReactNode }[] = [
  {
    id: 'body',
    label: 'Body & Style',
    icon: <UserRound size={28} aria-hidden />,
  },
  { id: 'hair', label: 'Hair', icon: <Sparkles size={28} aria-hidden /> },
  { id: 'face', label: 'Face', icon: <Laugh size={28} aria-hidden /> },
  { id: 'colours', label: 'Colours', icon: <Palette size={28} aria-hidden /> },
  { id: 'wardrobe', label: 'Wardrobe', icon: <Shirt size={28} aria-hidden /> },
]

type AvatarPanelProps = {
  onBack?: () => void
  onComplete?: () => void
}

export function AvatarPanel({ onBack, onComplete }: AvatarPanelProps = {}) {
  const [step, setStep] = useState<CustomizationStepId>('hub')
  const [bodySection, setBodySection] = useState<BodySectionId>('body')
  const [importStatus, setImportStatus] = useState('')
  const projectInputRef = useRef<HTMLInputElement>(null)
  const textureInputRef = useRef<HTMLInputElement>(null)
  const avatar = useGameStore((state) => state.avatar)
  const savedAvatars = useGameStore((state) => state.savedAvatars)
  const playerName = useGameStore((state) => state.playerName)
  const coins = useGameStore((state) => state.coins)
  const unlocked = useGameStore((state) => state.unlockedItems)
  const playerEmote = useGameStore((state) => state.playerEmote)
  const setOpenPanel = useGameStore((state) => state.setOpenPanel)
  const setPlayerName = useGameStore((state) => state.setPlayerName)
  const updateAvatar = useGameStore((state) => state.updateAvatar)
  const saveCurrentAvatarStyle = useGameStore(
    (state) => state.saveCurrentAvatarStyle,
  )
  const applySavedAvatarStyle = useGameStore(
    (state) => state.applySavedAvatarStyle,
  )
  const deleteSavedAvatarStyle = useGameStore(
    (state) => state.deleteSavedAvatarStyle,
  )
  const selectCustomizationItem = useGameStore(
    (state) => state.selectCustomizationItem,
  )
  const stepIndex = stepOrder.indexOf(step)
  const stepInfo = customizationSteps[stepIndex]
  const ownedCount = allCustomizationItems.filter(
    (item) => !item.shopItemId || unlocked.includes(item.shopItemId),
  ).length

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
    const preset =
      brickAvatarPresets[Math.floor(Math.random() * brickAvatarPresets.length)]
    updateAvatar(presetToAvatar(preset))
  }
  const importProjectFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text())
      const imported = mapBlockSkinProject(parsed)
      updateAvatar(imported.avatar)
      setImportStatus(`Imported ${imported.name ?? file.name}`)
    } catch {
      setImportStatus('Could not import that project file')
    }
  }
  const importTextureFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const patch = await sampleTextureAvatar(file)
      updateAvatar({
        ...patch,
        avatarSource: file.name.replace(/\.[^.]+$/, '') || 'Imported texture',
      })
      setImportStatus(`Sampled colours from ${file.name}`)
    } catch {
      setImportStatus('Could not read that texture')
    }
  }

  return (
    <section className="bb-customizer absolute inset-0 z-50 overflow-hidden text-white">
      <div className="bb-customizer-bg" aria-hidden>
        <div className="bb-town-skyline" />
      </div>
      <header className="bb-customizer-topbar">
        <button
          type="button"
          className="bb-customizer-back"
          onClick={previous}
          aria-label="Back"
        >
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
        {step === 'hub' ? (
          <HubStep
            avatar={avatar}
            playerName={playerName}
            savedAvatars={savedAvatars}
            onNameChange={setPlayerName}
            onApplySaved={applySavedAvatarStyle}
            onDeleteSaved={deleteSavedAvatarStyle}
            onStep={setStep}
            onBodySection={setBodySection}
          />
        ) : null}
        {step === 'body' ? (
          <BodyStep
            avatar={avatar}
            activeSection={bodySection}
            onSection={setBodySection}
            updateAvatar={updateAvatar}
            savedAvatars={savedAvatars}
            onSaveStyle={() => saveCurrentAvatarStyle()}
            onApplySaved={applySavedAvatarStyle}
            onDeleteSaved={deleteSavedAvatarStyle}
            onImportProject={() => projectInputRef.current?.click()}
            onImportTexture={() => textureInputRef.current?.click()}
            importStatus={importStatus}
          />
        ) : null}
        {step === 'clothing' ? (
          <ClothingStep
            avatar={avatar}
            onRandomize={randomize}
            onSelect={selectItem}
          />
        ) : null}
        {step === 'accessories' ? (
          <AccessoriesStep
            avatar={avatar}
            ownedCount={ownedCount}
            onSelect={selectItem}
            unlocked={unlocked}
          />
        ) : null}
        {step === 'emotes' ? (
          <EmotesStep
            avatar={avatar}
            playerEmote={playerEmote}
            onSelect={selectItem}
          />
        ) : null}
        {step === 'trails' ? (
          <TrailsStep
            avatar={avatar}
            onSelect={selectItem}
            unlocked={unlocked}
          />
        ) : null}
      </main>
      <input
        ref={projectInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(event) => {
          void importProjectFile(event.target.files?.[0])
          event.currentTarget.value = ''
        }}
      />
      <input
        ref={textureInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => {
          void importTextureFile(event.target.files?.[0])
          event.currentTarget.value = ''
        }}
      />

      <footer className="bb-customizer-footer">
        <button
          type="button"
          className="bb-customizer-save"
          aria-label="Save Character"
          onClick={() => saveCurrentAvatarStyle(playerName)}
        >
          <Save size={20} aria-hidden />
          Save
        </button>
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
  playerName,
  savedAvatars,
  onNameChange,
  onApplySaved,
  onDeleteSaved,
  onStep,
  onBodySection,
}: {
  avatar: AvatarSettings
  playerName: string
  savedAvatars: SavedAvatarStyle[]
  onNameChange: (name: string) => void
  onApplySaved: (id: string) => void
  onDeleteSaved: (id: string) => void
  onStep: (step: CustomizationStepId) => void
  onBodySection: (section: BodySectionId) => void
}) {
  const openBody = (section: BodySectionId) => {
    onBodySection(section)
    onStep('body')
  }
  const categories: { label: string; icon: ReactNode; onClick: () => void }[] =
    [
      {
        label: 'Skin',
        icon: <UserRound size={31} />,
        onClick: () => openBody('body'),
      },
      {
        label: 'Hair',
        icon: <Sparkles size={31} />,
        onClick: () => openBody('hair'),
      },
      {
        label: 'Face',
        icon: <Laugh size={31} />,
        onClick: () => openBody('face'),
      },
      {
        label: 'Tops',
        icon: <Shirt size={31} />,
        onClick: () => onStep('clothing'),
      },
      {
        label: 'Bottoms',
        icon: <Footprints size={31} />,
        onClick: () => onStep('clothing'),
      },
      {
        label: 'Hats',
        icon: <BadgePlus size={31} />,
        onClick: () => onStep('accessories'),
      },
      {
        label: 'Accessories',
        icon: <Glasses size={31} />,
        onClick: () => onStep('accessories'),
      },
      {
        label: 'Emotes',
        icon: <Laugh size={31} />,
        onClick: () => onStep('emotes'),
      },
      {
        label: 'Trails',
        icon: <Sparkles size={31} />,
        onClick: () => onStep('trails'),
      },
    ]

  return (
    <>
      <div className="bb-hub-stage">
        <div className="bb-hub-preview">
          <AvatarStage avatar={avatar} size="large" />
        </div>
        <label className="bb-character-name-editor">
          <span>Character name</span>
          <input
            value={playerName}
            onChange={(event) => onNameChange(event.target.value)}
            maxLength={18}
            aria-label="Character name"
          />
        </label>
        <section
          className="bb-saved-character-strip"
          aria-label="Saved characters"
        >
          <div>
            <strong>Saved Characters</strong>
            <span>{Math.min(savedAvatars.length, 8)} / 8</span>
          </div>
          {savedAvatars.length === 0 ? (
            <div>
              <button
                type="button"
                className="bb-saved-character-add"
                onClick={() => openBody('body')}
              >
                <BadgePlus size={25} aria-hidden />
                <span>Add New</span>
              </button>
            </div>
          ) : (
            <div>
              {savedAvatars.slice(0, 6).map((style) => (
                <div key={style.id} className="bb-saved-character-card">
                  <button
                    type="button"
                    onClick={() => onApplySaved(style.id)}
                    aria-label={`Use ${style.name}`}
                  >
                    <MiniAvatar avatar={style.avatar} />
                    <span>{style.name}</span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${style.name}`}
                    onClick={() => onDeleteSaved(style.id)}
                  >
                    <Trash2 size={13} aria-hidden />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <div
        className="bb-hub-category-grid"
        aria-label="Customization categories"
      >
        {categories.map((category) => (
          <HubButton
            key={category.label}
            label={category.label}
            icon={category.icon}
            onClick={category.onClick}
          />
        ))}
      </div>
    </>
  )
}

function BodyStep({
  avatar,
  activeSection,
  onSection,
  updateAvatar,
  savedAvatars,
  onSaveStyle,
  onApplySaved,
  onDeleteSaved,
  onImportProject,
  onImportTexture,
  importStatus,
}: {
  avatar: AvatarSettings
  activeSection: BodySectionId
  onSection: (section: BodySectionId) => void
  updateAvatar: (avatar: Partial<AvatarSettings>) => void
  savedAvatars: SavedAvatarStyle[]
  onSaveStyle: () => void
  onApplySaved: (id: string) => void
  onDeleteSaved: (id: string) => void
  onImportProject: () => void
  onImportTexture: () => void
  importStatus: string
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
              title="Accent Colour"
              colors={accentColors}
              active={avatar.accentColor ?? accentColors[0]}
              onPick={(accentColor) => updateAvatar({ accentColor })}
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
        {activeSection === 'wardrobe' ? (
          <WardrobeControls
            avatar={avatar}
            savedAvatars={savedAvatars}
            updateAvatar={updateAvatar}
            onSaveStyle={onSaveStyle}
            onApplySaved={onApplySaved}
            onDeleteSaved={onDeleteSaved}
            onImportProject={onImportProject}
            onImportTexture={onImportTexture}
            importStatus={importStatus}
          />
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
    <nav
      className="bb-custom-side-rail bb-body-section-rail"
      aria-label="Body customisation sections"
    >
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

function WardrobeControls({
  avatar,
  savedAvatars,
  updateAvatar,
  onSaveStyle,
  onApplySaved,
  onDeleteSaved,
  onImportProject,
  onImportTexture,
  importStatus,
}: {
  avatar: AvatarSettings
  savedAvatars: SavedAvatarStyle[]
  updateAvatar: (avatar: Partial<AvatarSettings>) => void
  onSaveStyle: () => void
  onApplySaved: (id: string) => void
  onDeleteSaved: (id: string) => void
  onImportProject: () => void
  onImportTexture: () => void
  importStatus: string
}) {
  return (
    <>
      <section className="bb-wardrobe-panel">
        <h3>Brick Borough Presets</h3>
        <div className="bb-preset-grid">
          {brickAvatarPresets.map((preset) => (
            <button
              type="button"
              key={preset.name}
              onClick={() => updateAvatar(presetToAvatar(preset))}
            >
              <span style={{ background: preset.primaryColor }} />
              <strong>{preset.name}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="bb-wardrobe-panel">
        <h3>Import & Save</h3>
        <div className="bb-import-actions">
          <button type="button" onClick={onImportProject}>
            <Upload size={18} aria-hidden />
            Import project
          </button>
          <button type="button" onClick={onImportTexture}>
            <Palette size={18} aria-hidden />
            Sample texture
          </button>
          <button type="button" onClick={onSaveStyle}>
            <Save size={18} aria-hidden />
            Save style
          </button>
        </div>
        {importStatus ? <p>{importStatus}</p> : null}
      </section>

      <SelectPanel
        title="Outfit Style"
        active={avatar.outfitStyle ?? 'hoodie'}
        items={brickOutfitStyles}
        onPick={(outfitStyle) => updateAvatar({ outfitStyle })}
      />
      <PalettePanel
        title="Top Colour"
        colors={accentColors.concat([
          '#0b74ff',
          '#14b8a6',
          '#dc2626',
          '#7c3aed',
        ])}
        active={avatar.shirtColor}
        onPick={(shirtColor) => updateAvatar({ shirtColor })}
      />
      <PalettePanel
        title="Trim Colour"
        colors={accentColors.concat(['#ffffff', '#111827', '#38bdf8'])}
        active={avatar.secondaryColor ?? avatar.accentColor ?? accentColors[0]}
        onPick={(secondaryColor) =>
          updateAvatar({ secondaryColor, accentColor: secondaryColor })
        }
      />
      <SelectPanel
        title="Bottoms"
        active={avatar.bottomStyle ?? 'jeans'}
        items={brickBottomStyles}
        onPick={(bottomStyle) => updateAvatar({ bottomStyle })}
      />
      <PalettePanel
        title="Bottom Colour"
        colors={[
          '#111827',
          '#1d4ed8',
          '#334155',
          '#7c2d12',
          '#475569',
          '#f472b6',
        ]}
        active={avatar.pantsColor ?? '#111827'}
        onPick={(pantsColor) => updateAvatar({ pantsColor })}
      />
      <SelectPanel
        title="Shoes"
        active={avatar.shoeStyle ?? 'sneakers'}
        items={brickShoeStyles}
        onPick={(shoeStyle) => updateAvatar({ shoeStyle })}
      />
      <PalettePanel
        title="Shoe Colour"
        colors={[
          '#f8fafc',
          '#111827',
          '#e5e7eb',
          '#ef4444',
          '#2563eb',
          '#facc15',
        ]}
        active={avatar.shoeColor ?? '#f8fafc'}
        onPick={(shoeColor) => updateAvatar({ shoeColor })}
      />

      <section className="bb-wardrobe-panel">
        <h3>Saved Styles</h3>
        {savedAvatars.length === 0 ? (
          <p>No saved styles yet.</p>
        ) : (
          <div className="bb-saved-style-list">
            {savedAvatars.map((style) => (
              <div key={style.id}>
                <button type="button" onClick={() => onApplySaved(style.id)}>
                  <MiniAvatar avatar={style.avatar} />
                  <span>{style.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteSaved(style.id)}
                  aria-label={`Delete ${style.name}`}
                >
                  <Trash2 size={16} aria-hidden />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}

function SelectPanel<T extends string>({
  title,
  items,
  active,
  onPick,
}: {
  title: string
  items: { id: T; name: string }[]
  active: string
  onPick: (value: T) => void
}) {
  return (
    <section className="bb-mini-strip">
      <h3>{title}</h3>
      <div>
        {items.map((item) => (
          <button
            type="button"
            key={item.id}
            className={item.id === active ? 'active' : ''}
            onClick={() => onPick(item.id)}
          >
            {item.name.slice(0, 3)}
          </button>
        ))}
      </div>
    </section>
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
      <button
        type="button"
        className="bb-floating-tool left two"
        onClick={onRandomize}
      >
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
      <CatalogPanel
        tabs={clothingTabs}
        items={[...heroSkinItems, ...clothingItems, ...pantsItems]}
        avatar={avatar}
        onSelect={onSelect}
      />
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
          <strong>
            {ownedCount} / {allCustomizationItems.length}
          </strong>
        </div>
      </div>
      <CatalogPanel
        tabs={accessoryTabs}
        items={accessoryItems}
        avatar={avatar}
        onSelect={onSelect}
        unlocked={unlocked}
        dense
      />
    </>
  )
}

function EmotesStep({
  avatar,
  playerEmote,
  onSelect,
}: {
  avatar: AvatarSettings
  playerEmote: PlayerEmote
  onSelect: (item: CustomizationItem) => void
}) {
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
        <div className="bb-preview-label">
          Preview
          <br />
          Wave
        </div>
      </div>
      <CatalogPanel
        tabs={emoteTabs}
        items={emoteItems}
        avatar={avatar}
        playerEmote={playerEmote}
        onSelect={onSelect}
        className="emote-grid"
      />
      <div className="bb-quick-preview">
        <strong>Quick Preview</strong>
        <div>
          {previewItems.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => onSelect(item)}
              aria-label={`Preview ${item.name}`}
            >
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
      <CatalogPanel
        tabs={['All', 'Rainbow', 'Neon', 'Galaxy', 'Stars']}
        items={trailItems}
        avatar={avatar}
        onSelect={onSelect}
        unlocked={unlocked}
      />
    </>
  )
}

function HubButton({
  label,
  icon,
  onClick,
}: {
  label: string
  icon: ReactNode
  onClick: () => void
}) {
  return (
    <button type="button" className="bb-hub-button" onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  )
}

function SideRail({ items }: { items: [string, ReactNode][] }) {
  return (
    <nav className="bb-custom-side-rail" aria-label="Customization categories">
      {items.map(([label, icon], index) => (
        <button
          type="button"
          key={label}
          className={index === 0 ? 'active' : ''}
        >
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
        {colors.map((color, index) => (
          <button
            type="button"
            key={`${color}-${index}`}
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
          <button
            type="button"
            key={item.id}
            className={item.id === active ? 'active' : ''}
            onClick={() => onPick(item.patch)}
          >
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
  playerEmote = 'none',
  onSelect,
  unlocked = [],
  dense = false,
  className = '',
}: {
  tabs: string[]
  items: CustomizationItem[]
  avatar: AvatarSettings
  playerEmote?: PlayerEmote
  onSelect: (item: CustomizationItem) => void
  unlocked?: string[]
  dense?: boolean
  className?: string
}) {
  const [activeTab, setActiveTab] = useState(tabs[0] ?? 'All')
  const resolvedTab = tabs.includes(activeTab) ? activeTab : (tabs[0] ?? 'All')
  const visibleItems = useMemo(
    () => items.filter((item) => catalogItemMatchesTab(item, resolvedTab)),
    [items, resolvedTab],
  )

  return (
    <section
      className={`bb-custom-catalog ${dense ? 'dense' : ''} ${className}`}
    >
      <div className="bb-custom-tabs">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab}
            className={tab === resolvedTab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="bb-custom-grid">
        {visibleItems.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            avatar={avatar}
            owned={
              !item.shopItemId ||
              item.cost === 0 ||
              unlocked.includes(item.shopItemId)
            }
            equipped={isEquipped(avatar, item, playerEmote)}
            onSelect={() => onSelect(item)}
          />
        ))}
      </div>
    </section>
  )
}

function catalogItemMatchesTab(item: CustomizationItem, tab: string) {
  if (tab === 'All') return true
  if (tab === 'Hero Skins') return item.kind === 'skin'
  if (tab === 'Tops') return item.kind === 'top'
  if (tab === 'Hoodies')
    return item.kind === 'top' && item.patch.outfitStyle === 'hoodie'
  if (tab === 'Shirts')
    return item.kind === 'top' && item.patch.outfitStyle !== 'hoodie'
  if (tab === 'Pants')
    return item.kind === 'pants' && item.patch.bottomStyle !== undefined
  if (tab === 'Shoes')
    return item.kind === 'pants' && item.patch.shoeStyle !== undefined
  if (tab === 'Hats') return item.kind === 'hat'
  if (tab === 'Glasses')
    return (
      item.patch.accessory === 'glasses-star' ||
      item.patch.accessory === 'visor-neon'
    )
  if (tab === 'Headphones')
    return String(item.patch.accessory ?? '').includes('headphones')
  if (tab === 'Backpacks')
    return (
      String(item.patch.accessory ?? '').includes('backpack') ||
      String(item.patch.accessory ?? '').includes('pack')
    )
  if (tab === 'Pets') return String(item.patch.accessory ?? '').includes('pet')
  if (tab === 'Effects')
    return (
      item.kind === 'accessory' &&
      !['glasses-star', 'visor-neon'].includes(
        String(item.patch.accessory ?? ''),
      )
    )
  if (tab === 'Dances') return item.name.toLowerCase().includes('dance')
  if (tab === 'Gestures')
    return ['wave', 'cheer', 'thumbs-up', 'point', 'salute', 'laugh'].includes(
      item.id,
    )
  if (tab === 'Sits') return item.id === 'sit'
  if (tab === 'Actions')
    return !['wave', 'dance', 'cheer', 'sit'].includes(item.id)
  if (tab === 'Rainbow') return item.id.includes('rainbow')
  if (tab === 'Neon') return item.id.includes('neon')
  if (tab === 'Galaxy') return item.id.includes('galaxy')
  if (tab === 'Stars') return item.id.includes('star')
  return true
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
    <button
      type="button"
      className={`bb-custom-item ${equipped ? 'equipped' : ''}`}
      onClick={onSelect}
    >
      {equipped ? (
        <span className="bb-equipped-check">
          <Check size={18} aria-hidden />
        </span>
      ) : null}
      <span className="bb-custom-item-preview">
        <ItemPreview item={item} avatar={avatar} />
      </span>
      <strong>{item.name}</strong>
      <span className={`rarity ${item.rarity.toLowerCase()}`}>
        {item.rarity}
      </span>
      <span className={owned ? 'price owned' : 'price'}>
        {equipped ? 'Equipped' : item.cost === 0 ? 'Free' : `${item.cost}`}
      </span>
    </button>
  )
}

function ItemPreview({
  item,
  avatar,
}: {
  item: CustomizationItem
  avatar: AvatarSettings
}) {
  if (item.kind === 'skin')
    return <MiniAvatar avatar={{ ...avatar, ...item.patch }} />
  if (item.kind === 'emote')
    return <MiniAvatar avatar={avatar} pose={item.emote ?? 'wave'} />
  if (item.kind === 'top')
    return (
      <span
        className="bb-item-top"
        style={
          {
            '--item-color': item.color,
            '--item-accent': item.accent ?? '#ffffff',
          } as CSSProperties
        }
      />
    )
  if (item.kind === 'pants')
    return (
      <span
        className="bb-item-pants"
        style={{ '--item-color': item.color } as CSSProperties}
      />
    )
  if (item.kind === 'trail')
    return (
      <span
        className="bb-item-trail"
        style={
          {
            '--item-color': item.color,
            '--item-accent': item.accent ?? '#ffffff',
          } as CSSProperties
        }
      />
    )
  return (
    <span
      className={`bb-item-accessory ${item.kind}`}
      style={
        {
          '--item-color': item.color,
          '--item-accent': item.accent ?? '#ffffff',
        } as CSSProperties
      }
    />
  )
}

function isEquipped(
  avatar: AvatarSettings,
  item: CustomizationItem,
  playerEmote: PlayerEmote = 'none',
) {
  if (item.kind === 'emote') {
    if (playerEmote === 'none') return false
    const firstMatchingEmote = emoteItems.find(
      (candidate) => candidate.emote === playerEmote,
    )
    return item.emote === playerEmote && item.id === firstMatchingEmote?.id
  }
  return Object.entries(item.patch).every(
    ([key, value]) => avatar[key as keyof AvatarSettings] === value,
  )
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
  const [previewYaw, setPreviewYaw] = useState(-0.2)
  const dragRef = useRef<{ pointerId: number; x: number } | undefined>(
    undefined,
  )

  const stopDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (dragRef.current?.pointerId === event.pointerId)
      dragRef.current = undefined
  }

  return (
    <div className={`bb-avatar-stage ${size}`}>
      <div
        className="bb-avatar-turntable"
        role="img"
        aria-label="Character preview. Drag left or right to turn."
        data-preview-yaw={previewYaw.toFixed(3)}
        onPointerDown={(event) => {
          if (event.pointerType === 'mouse' && event.button !== 0) return
          event.preventDefault()
          if (event.nativeEvent.isTrusted)
            event.currentTarget.setPointerCapture?.(event.pointerId)
          dragRef.current = { pointerId: event.pointerId, x: event.clientX }
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current
          if (!drag || drag.pointerId !== event.pointerId) return
          event.preventDefault()
          const dx = event.clientX - drag.x
          dragRef.current = { pointerId: event.pointerId, x: event.clientX }
          setPreviewYaw((current) => current + dx * 0.012)
        }}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
      >
        {showTrail ? <span className="bb-avatar-trail" /> : null}
        <GameAvatarPreview
          avatar={avatar}
          pose={pose === 'idle' ? 'none' : pose}
          yaw={previewYaw}
        />
      </div>
    </div>
  )
}

function MiniAvatar({
  avatar,
  pose = 'idle',
}: {
  avatar: AvatarSettings
  pose?: string
}) {
  return (
    <span
      className={`bb-mini-avatar pose-${pose} hair-${avatar.hairStyle ?? 'spiky'} face-${avatar.face ?? 'smile'} outfit-${avatar.outfitStyle ?? 'hoodie'} bottom-${avatar.bottomStyle ?? 'jeans'} shoes-${avatar.shoeStyle ?? 'sneakers'}`}
      style={
        {
          '--skin': avatar.bodyColor,
          '--shirt': avatar.shirtColor,
          '--hair': avatar.hairColor ?? '#5a2f16',
          '--pants': avatar.pantsColor ?? '#111827',
          '--accent': avatar.accentColor ?? '#0b74ff',
          '--secondary': avatar.secondaryColor ?? '#ffffff',
          '--eyes': avatar.eyeColor ?? '#111827',
          '--shoe': avatar.shoeColor ?? '#f8fafc',
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
      {String(avatar.accessory ?? '').includes('hero-cape') ? (
        <span className="cape" />
      ) : null}
      {avatar.hat !== 'none' ? <span className="hat" /> : null}
      {avatar.accessory && avatar.accessory !== 'none' ? (
        <span className="glasses" />
      ) : null}
    </span>
  )
}

async function sampleTextureAvatar(
  file: File,
): Promise<Partial<AvatarSettings>> {
  const image = await loadImage(file)
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('Canvas unavailable')
  context.drawImage(image, 0, 0, 64, 64)

  return {
    bodyColor: averageColor(context, 8, 8, 8, 8),
    hairColor: averageColor(context, 8, 0, 8, 8),
    shirtColor: averageColor(context, 4, 20, 8, 12),
    pantsColor: averageColor(context, 4, 36, 4, 9),
    shoeColor: averageColor(context, 4, 45, 4, 3),
    outfitStyle: 'hoodie',
    bottomStyle: 'jeans',
    shoeStyle: 'sneakers',
  }
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    const url = URL.createObjectURL(file)
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image failed to load'))
    }
    image.src = url
  })
}

function averageColor(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const data = context.getImageData(x, y, width, height).data
  let r = 0
  let g = 0
  let b = 0
  let count = 0
  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] < 10) continue
    r += data[index]
    g += data[index + 1]
    b += data[index + 2]
    count += 1
  }
  if (!count) return '#f8d6c2'
  return `#${toHex(r / count)}${toHex(g / count)}${toHex(b / count)}`
}

function toHex(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, '0')
}
