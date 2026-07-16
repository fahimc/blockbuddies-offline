type BrandLogoProps = {
  compact?: boolean
}

export function BrandLogo({ compact = false }: BrandLogoProps) {
  return (
    <div className={`bb-brand ${compact ? 'bb-brand-compact' : ''}`} aria-label="BlockBuddies">
      <div className="bb-brand-mascot" aria-hidden>
        <span className="bb-mascot-head">
          <span className="bb-mascot-eye left" />
          <span className="bb-mascot-eye right" />
          <span className="bb-mascot-smile" />
        </span>
        <span className="bb-mascot-arm left" />
        <span className="bb-mascot-arm right" />
      </div>
      <div className="bb-brand-text">
        <div className="bb-logo-line">
          <span className="bb-logo-white">Block</span>
          <span className="bb-logo-gold">Buddies</span>
        </div>
      </div>
    </div>
  )
}
