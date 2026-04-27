{
  "brand": {
    "name": "CipherStakes",
    "personality": [
      "premium dark luxury",
      "high-stakes but compliant",
      "trustworthy (investor-ready)",
      "exclusive (members-club energy)",
      "crypto-adjacent without casino cues"
    ],
    "do_not": [
      "No playful/cartoonish visuals",
      "No casino motifs (slots, confetti for non-wins, neon rainbow)",
      "No clutter; one primary CTA per screen",
      "No centered app container defaults",
      "No purple/pink gradients (see gradient restriction rule)"
    ]
  },
  "design_tokens": {
    "css_custom_properties": {
      "notes": "Implement in /app/frontend/src/index.css under :root and .dark. Use these tokens instead of shadcn defaults. App should run in dark mode by default (apply className=\"dark\" on html/body root).",
      "colors": {
        "--cs-bg": "#0A0A0F",
        "--cs-surface": "#10101E",
        "--cs-surface-2": "#0F0F1A",
        "--cs-text": "#F0F0F5",
        "--cs-text-muted": "#8888A0",
        "--cs-gold": "#C9A84C",
        "--cs-gold-2": "#D4AF37",
        "--cs-violet": "#6C3FC5",
        "--cs-violet-2": "#7B4FD4",
        "--cs-success": "#22C55E",
        "--cs-border": "rgba(255,255,255,0.08)",
        "--cs-border-strong": "rgba(255,255,255,0.14)",
        "--cs-shadow": "0 18px 60px rgba(0,0,0,0.55)",
        "--cs-glow-gold": "0 0 0 1px rgba(201,168,76,0.22), 0 0 28px rgba(201,168,76,0.12)",
        "--cs-glow-violet": "0 0 0 1px rgba(108,63,197,0.22), 0 0 28px rgba(108,63,197,0.12)",
        "--cs-focus-ring": "0 0 0 3px rgba(201,168,76,0.22)"
      },
      "shadcn_hsl_mapping": {
        "notes": "shadcn uses HSL tokens. Map to approximate HSL values while keeping exact HEX available for custom utilities. Prefer using HEX via Tailwind arbitrary values for key accents.",
        "--background": "240 33% 5%",
        "--foreground": "240 20% 96%",
        "--card": "240 30% 9%",
        "--card-foreground": "240 20% 96%",
        "--popover": "240 30% 9%",
        "--popover-foreground": "240 20% 96%",
        "--primary": "44 52% 55%",
        "--primary-foreground": "240 33% 5%",
        "--secondary": "240 18% 14%",
        "--secondary-foreground": "240 20% 96%",
        "--muted": "240 18% 14%",
        "--muted-foreground": "240 10% 60%",
        "--accent": "262 52% 51%",
        "--accent-foreground": "240 20% 96%",
        "--border": "240 10% 18%",
        "--input": "240 10% 18%",
        "--ring": "44 52% 55%",
        "--radius": "0.9rem"
      },
      "typography": {
        "font_pairing": {
          "ui": "Inter (preferred) or Sora",
          "display": "Playfair Display or DM Serif Display"
        },
        "google_fonts_import": "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap');",
        "scale": {
          "h1": "text-4xl sm:text-5xl lg:text-6xl",
          "h2": "text-base md:text-lg",
          "body": "text-sm md:text-base",
          "small": "text-xs"
        },
        "number_style": {
          "notes": "Jackpot numbers use display font + tabular numerals for stable counter animation.",
          "classes": "font-[\"Playfair Display\"] tabular-nums tracking-tight"
        }
      },
      "spacing": {
        "container": "px-4 sm:px-6 lg:px-8",
        "section_y": "py-10 sm:py-14 lg:py-18",
        "card_padding": "p-4 sm:p-5",
        "gap": "gap-4 sm:gap-6"
      },
      "radius": {
        "card": "rounded-2xl",
        "button": "rounded-xl",
        "pill": "rounded-full"
      }
    },
    "tailwind_utilities": {
      "recommended_custom_classes": {
        "notes": "Add these as reusable class strings in components (do not rely on global CSS classes unless necessary).",
        "surface": "bg-[var(--cs-surface)] border border-[var(--cs-border)]",
        "surface2": "bg-[var(--cs-surface-2)] border border-[var(--cs-border)]",
        "textMuted": "text-[color:var(--cs-text-muted)]",
        "goldText": "text-[#C9A84C]",
        "goldBorderHover": "hover:shadow-[var(--cs-glow-gold)] hover:border-[rgba(201,168,76,0.35)]",
        "violetBorderHover": "hover:shadow-[var(--cs-glow-violet)] hover:border-[rgba(108,63,197,0.35)]",
        "focusRing": "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]/40 focus-visible:ring-offset-0"
      }
    }
  },
  "layout_system": {
    "grid": {
      "max_width": "max-w-6xl (marketing), max-w-7xl (app)",
      "columns": {
        "mobile": "1 col",
        "tablet": "2 cols for draw cards/pricing",
        "desktop": "3 cols for draws, 4 cols for pack tiers (or 3 + featured)"
      },
      "breakpoints": {
        "mobile_first": true,
        "sm": "640px",
        "md": "768px",
        "lg": "1024px",
        "xl": "1280px"
      },
      "page_shell": {
        "public": "Top nav (sticky) + hero + sections; footer",
        "authenticated": "Sticky header with balance pill + secondary nav tabs; content scroll"
      }
    },
    "navigation": {
      "public_header": {
        "structure": [
          "Left: CipherStakes wordmark (gold)",
          "Center (desktop): NavigationMenu links: Draws, How it works, FAQ, Results",
          "Right: Login (ghost), Create account (gold primary)"
        ],
        "mobile": "Hamburger -> Sheet with links + CTA buttons",
        "sticky_behavior": "Sticky with subtle blur and border; on scroll add slightly stronger border and reduce padding",
        "classes": "sticky top-0 z-50 bg-[rgba(10,10,15,0.72)] backdrop-blur-md border-b border-[var(--cs-border)]"
      },
      "authed_header": {
        "structure": [
          "Left: wordmark",
          "Center: Tabs (Dashboard, Draws, Store, Results)",
          "Right: Balance pill + Profile dropdown"
        ],
        "always_visible_balance": true
      }
    }
  },
  "core_components": {
    "component_path": {
      "shadcn_primary": [
        "/app/frontend/src/components/ui/button.jsx",
        "/app/frontend/src/components/ui/card.jsx",
        "/app/frontend/src/components/ui/dialog.jsx",
        "/app/frontend/src/components/ui/drawer.jsx",
        "/app/frontend/src/components/ui/sheet.jsx",
        "/app/frontend/src/components/ui/tabs.jsx",
        "/app/frontend/src/components/ui/navigation-menu.jsx",
        "/app/frontend/src/components/ui/badge.jsx",
        "/app/frontend/src/components/ui/progress.jsx",
        "/app/frontend/src/components/ui/table.jsx",
        "/app/frontend/src/components/ui/pagination.jsx",
        "/app/frontend/src/components/ui/skeleton.jsx",
        "/app/frontend/src/components/ui/separator.jsx",
        "/app/frontend/src/components/ui/sonner.jsx",
        "/app/frontend/src/components/ui/form.jsx",
        "/app/frontend/src/components/ui/input.jsx",
        "/app/frontend/src/components/ui/label.jsx",
        "/app/frontend/src/components/ui/tooltip.jsx",
        "/app/frontend/src/components/ui/accordion.jsx"
      ]
    },
    "buttons": {
      "style": "Luxury / Elegant",
      "variants": {
        "primary_gold": {
          "usage": "Primary CTA per screen (Enter draw, Buy pack, Claim daily coins)",
          "classes": "bg-[#C9A84C] text-[#0A0A0F] hover:bg-[#D4AF37] active:bg-[#B8922F] shadow-[0_10px_30px_rgba(201,168,76,0.18)]",
          "motion": "hover: slight lift (translateY -1px) + glow; active: scale 0.98"
        },
        "secondary_violet": {
          "usage": "Draw entry secondary moments (e.g., View details, Switch draw)",
          "classes": "bg-[#6C3FC5] text-[#F0F0F5] hover:bg-[#7B4FD4] shadow-[0_10px_30px_rgba(108,63,197,0.16)]"
        },
        "ghost": {
          "usage": "Login, tertiary actions",
          "classes": "bg-transparent text-[#F0F0F5] border border-[var(--cs-border)] hover:border-[rgba(255,255,255,0.16)] hover:bg-[rgba(255,255,255,0.03)]"
        }
      },
      "sizes": {
        "sm": "h-9 px-3 text-sm",
        "md": "h-11 px-4 text-sm",
        "lg": "h-12 px-5 text-base"
      },
      "focus": "Use focus-visible ring with gold; never remove focus styles",
      "data_testid_rule": "All buttons must include data-testid (e.g., data-testid=\"draw-enter-button\")."
    },
    "cards": {
      "base": {
        "classes": "rounded-2xl bg-[var(--cs-surface)] border border-[var(--cs-border)] shadow-[var(--cs-shadow)]",
        "hover": "On hover: border shifts toward gold + subtle gold glow (no big scale).",
        "hover_classes": "transition-colors duration-200 hover:border-[rgba(201,168,76,0.35)] hover:shadow-[var(--cs-glow-gold)]"
      }
    },
    "coin_balance_pill": {
      "anatomy": [
        "Left: coin icon (gold)",
        "Middle: balance number (tabular-nums)",
        "Right: label 'Cipher Coins' (muted)"
      ],
      "classes": "inline-flex items-center gap-2 rounded-full border border-[var(--cs-border)] bg-[rgba(16,16,30,0.9)] px-3 py-1.5",
      "number_classes": "font-semibold tabular-nums text-[#F0F0F5]",
      "icon_classes": "text-[#C9A84C]",
      "interaction": "Click opens Drawer/Popover with balances: Cipher Gold (purchased, no prize value) + Cipher Coins (entry currency) + quick actions",
      "data_testid": "header-coin-balance-pill"
    }
  },
  "page_guidelines": {
    "landing_home": {
      "hero": {
        "goal": "Make T1 Daily Flash jackpot the acquisition hook.",
        "layout": "Split-screen on desktop (left copy + CTAs, right hero draw card). On mobile: stacked with jackpot card first.",
        "background": "Solid near-black with subtle noise overlay + a very small indigo ambient glow blob behind the hero card (<=20% viewport).",
        "jackpot_counter": {
          "visual": "Large gold number in Playfair Display; label above in muted text; small 'updates every 30s' caption.",
          "classes": "font-[\"Playfair Display\"] text-5xl sm:text-6xl lg:text-7xl text-[#C9A84C] tabular-nums tracking-tight",
          "behavior": [
            "Poll backend every 30s",
            "Animate number changes with spring (Framer Motion) using per-digit roll or crossfade+slide",
            "Idle pulse: very subtle glow breathing (opacity 0.85->1) every 3.2s"
          ],
          "motion_scaffold_js": "Use framer-motion: <motion.span animate={{ filter: ['drop-shadow(0 0 0 rgba(201,168,76,0))','drop-shadow(0 0 18px rgba(201,168,76,0.22))','drop-shadow(0 0 0 rgba(201,168,76,0))'] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }} />"
        },
        "primary_cta": "View active draws (gold primary)",
        "secondary_cta": "How it works (ghost)",
        "trust_strip": {
          "content": [
            "Legally structured sweepstakes (not gambling)",
            "Entry receipts with UUID + sha256 hash",
            "KYC only for winners"
          ],
          "component": "Badge + Separator",
          "classes": "mt-6 flex flex-wrap gap-2 text-xs text-[var(--cs-text-muted)]"
        }
      },
      "active_draws_preview": {
        "layout": "2 cards on mobile (carousel optional), 3 on desktop grid.",
        "component": "Card + AspectRatio for image",
        "cta": "Each card has one CTA: Enter (violet for non-hero draws, gold for T1)."
      },
      "how_it_works": {
        "layout": "3-step vertical timeline on mobile; 3 columns on desktop.",
        "tone": "Compliance-first language; avoid gambling words.",
        "component": "Card + Badge + Accordion for FAQ teaser"
      },
      "footer": {
        "layout": "Dense but clean: legal links + country availability + support email.",
        "style": "No gradients; solid surface2 with border-top."
      }
    },
    "auth_pages": {
      "login_register": {
        "layout": "Centered card but page content left-aligned inside card; include brand mark above.",
        "components": "Card + Form + Input + Button + Separator",
        "google_oauth": "Secondary button with border; include provider icon.",
        "microcopy": "Explicit sweepstakes compliance note under submit.",
        "data_testids": [
          "auth-email-input",
          "auth-password-input",
          "auth-submit-button",
          "auth-google-button",
          "auth-forgot-password-link"
        ]
      },
      "verify_email": {
        "moment": "Use a calm success state (emerald) with check icon; no confetti.",
        "component": "Alert (success)"
      }
    },
    "dashboard": {
      "top_section": {
        "layout": "Balance row + daily claim module.",
        "daily_claim": {
          "component": "Card + Button + Progress",
          "streak_bar": "7-day segmented bar; completed segments gold, current violet outline, future muted.",
          "claim_button": "Gold primary; disabled state uses muted border and text.",
          "data_testids": [
            "daily-claim-button",
            "streak-bar",
            "dashboard-balance-card"
          ]
        }
      },
      "entries_list": {
        "component": "Table (mobile: Card list)",
        "fields": [
          "Draw name",
          "Entry count",
          "Entry ID (UUID)",
          "Receipt hash (sha256)",
          "Status"
        ],
        "empty_state": "Show Skeleton then empty card with CTA to View Draws."
      },
      "referral": {
        "component": "Card + Input (copy) + Button",
        "interaction": "Copy button triggers sonner toast: 'Referral link copied'.",
        "data_testids": [
          "referral-link-input",
          "referral-copy-button"
        ]
      }
    },
    "draws_page": {
      "layout": "Grid of draw cards; T1 pinned first with larger span on desktop.",
      "filters": "Tabs: Active, Upcoming, Completed (Tabs component).",
      "loading": "Skeleton cards with image block + jackpot lines."
    },
    "draw_detail": {
      "hero": {
        "layout": "Prize image (top) + jackpot block + entry module.",
        "prize_image": "Prominent, dark studio imagery; use AspectRatio 16:9; subtle vignette overlay.",
        "jackpot_block": "Large gold number; show 'Rolling USDC jackpot' label; show next draw time.",
        "entry_module": {
          "quantity_selector": "Use Slider or stepper buttons (+/-) with tabular number; keep one primary CTA: 'Lock in entry'.",
          "burn_modal": {
            "component": "Dialog",
            "content": [
              "Summary: entries, coin cost, remaining balance",
              "Compliance note: 'Cipher Gold has no prize value'",
              "Primary confirm button (gold)",
              "Secondary cancel (ghost)"
            ],
            "data_testids": [
              "entry-quantity-selector",
              "entry-confirm-open-modal-button",
              "entry-confirm-burn-button",
              "entry-cancel-burn-button"
            ]
          }
        }
      },
      "receipt_locked_in_view": {
        "moment": {
          "goal": "Satisfying, premium 'locked in' confirmation.",
          "animation": [
            "Modal closes -> receipt card slides up from bottom (mobile) / fades in (desktop)",
            "Green checkmark draws (stroke animation) + subtle click sound optional (respect prefers-reduced-motion)",
            "Gold border glow sweeps once across the receipt edge (2.2s)"
          ],
          "receipt_anatomy": [
            "Title: 'Entry locked in' (emerald)",
            "Entry ID (UUID) large + copy button",
            "Receipt hash (sha256) monospace small + copy",
            "Timestamp",
            "CTA: 'View results feed' (ghost)"
          ],
          "components": "Card + Badge + Button + Tooltip + Sonner",
          "data_testids": [
            "entry-receipt-card",
            "entry-receipt-entry-id",
            "entry-receipt-hash",
            "entry-receipt-copy-entry-id-button",
            "entry-receipt-copy-hash-button"
          ]
        }
      }
    },
    "pack_store": {
      "layout": "Pricing tier grid with one featured tier (recommended).",
      "tier_cards": {
        "anatomy": [
          "Tier name",
          "Price",
          "Coins included",
          "Value badge (e.g., '+15% bonus coins')",
          "Primary CTA: 'Buy pack'"
        ],
        "featured_tier": "Slightly taller, gold border at rest, subtle glow idle.",
        "hover": "Gold border glow intensifies; CTA brightens; no big scale.",
        "data_testids": [
          "pack-tier-card-<tier>",
          "pack-buy-button-<tier>"
        ]
      },
      "stripe_redirect": "After click, show loading state on button + sonner toast 'Redirecting to secure checkout…'."
    },
    "results_page": {
      "layout": "Public feed with pagination; each row shows draw, date, winning entry ID.",
      "components": "Table + Pagination + Badge",
      "winner_row": "Winning entry ID highlighted with gold outline; copy button.",
      "data_testids": [
        "results-table",
        "results-pagination-next",
        "results-winning-entry-id"
      ]
    },
    "profile": {
      "sections": [
        "Account",
        "Transaction history",
        "Referral tracking",
        "Payout methods",
        "KYC (only when winner)"
      ],
      "transaction_history": "Table on desktop; cards on mobile.",
      "kyc_flow": {
        "tone": "Dignified, secure, compliance-first.",
        "components": "Form + Input + Select + Alert",
        "states": [
          "Not required",
          "Required",
          "Submitted",
          "Approved",
          "Rejected (with next steps)"
        ],
        "data_testids": [
          "kyc-form",
          "kyc-submit-button",
          "payout-method-select"
        ]
      }
    },
    "how_it_works_faq": {
      "layout": "Marketing content with Accordion sections.",
      "compliance_callout": "Use Alert with border and muted background; no gradients.",
      "components": "Accordion + Alert + Separator"
    }
  },
  "draw_card_spec": {
    "anatomy": {
      "top": "Prize image (AspectRatio 16:9) with subtle vignette overlay",
      "middle": "Jackpot block: label + large gold number (display font)",
      "meta": "Entry cost in Cipher Coins + draw cadence (Daily/Weekly)",
      "bottom": "Single CTA button (Enter / View draw)"
    },
    "classes": {
      "card": "group rounded-2xl overflow-hidden bg-[var(--cs-surface)] border border-[var(--cs-border)] shadow-[var(--cs-shadow)] transition-colors duration-200 hover:border-[rgba(201,168,76,0.35)] hover:shadow-[var(--cs-glow-gold)]",
      "imageOverlay": "absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.55)_70%,rgba(0,0,0,0.75)_100%)]",
      "jackpotNumber": "font-[\"Playfair Display\"] text-4xl sm:text-5xl text-[#C9A84C] tabular-nums tracking-tight",
      "metaText": "text-xs text-[var(--cs-text-muted)]"
    },
    "hover_microinteraction": {
      "rules": [
        "No scale > 1.01",
        "Border glow is the primary hover signal",
        "CTA button gets slightly brighter"
      ],
      "framer_motion": "Use whileHover on card to animate boxShadow and borderColor; keep duration 0.18-0.24s."
    },
    "data_testid": {
      "card": "draw-card-<draw-id>",
      "cta": "draw-card-cta-<draw-id>",
      "jackpot": "draw-card-jackpot-<draw-id>"
    }
  },
  "states": {
    "loading": {
      "components": "Skeleton",
      "pattern": "Use skeleton blocks matching final layout; avoid spinners as primary indicator."
    },
    "empty": {
      "pattern": "Card with concise message + single CTA.",
      "examples": [
        "No entries yet -> CTA: View draws",
        "No results -> CTA: Check active draws"
      ]
    },
    "error": {
      "pattern": "Alert (destructive) with clear next step; include support link in footer.",
      "copy": "Avoid blame; be precise (e.g., 'We couldn't lock in your entry. Your coins were not deducted. Try again.')."
    }
  },
  "motion_and_microinteractions": {
    "principles": [
      "Premium = restrained motion (small distances, soft easing)",
      "Use Framer Motion for entrance + confirmation moments",
      "Respect prefers-reduced-motion"
    ],
    "timings": {
      "fast": "120-180ms",
      "standard": "200-260ms",
      "slow": "320-420ms (hero counter pulse only)"
    },
    "easing": {
      "default": "cubic-bezier(0.2, 0.8, 0.2, 1)",
      "spring": "stiffness 260, damping 26"
    },
    "locked_in_animation": {
      "checkmark": "Use lucide-react CheckCircle2; animate scale 0.96->1 and opacity 0->1; optional SVG path draw.",
      "receipt_glow_sweep": "Pseudo-element gradient sweep across border (gold at 10% opacity) once; keep subtle."
    }
  },
  "accessibility": {
    "contrast": "Gold on near-black passes; ensure muted text still readable (avoid below #7A7A92).",
    "focus": "Visible gold focus ring on all interactive elements.",
    "touch_targets": "Minimum 44px height for primary actions.",
    "reduced_motion": "Disable pulsing and sweeping animations when prefers-reduced-motion is set."
  },
  "images": {
    "image_urls": {
      "t1_cash_usdc_abstract": [
        {
          "url": "https://images.unsplash.com/photo-1647104568641-bd427704384c?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85",
          "usage": "T1 Daily Flash hero/draw card image (abstract wealth close-up)"
        },
        {
          "url": "https://images.pexels.com/photos/7267507/pexels-photo-7267507.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
          "usage": "Alt T1 image (stacked coins on dark reflective surface)"
        }
      ],
      "t2_luxury_watch": [
        {
          "url": "https://images.unsplash.com/photo-1573152416688-41316d295ed9?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85",
          "usage": "T2 Weekly Stakes prize image (watch flat lay)"
        },
        {
          "url": "https://images.pexels.com/photos/5659200/pexels-photo-5659200.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
          "usage": "Alt T2 watch image (dark table, premium feel)"
        }
      ],
      "t3_t4_car_placeholder": [
        {
          "url": "https://images.pexels.com/photos/31298995/pexels-photo-31298995.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
          "usage": "Placeholder prize image (black sports car side profile)"
        }
      ]
    }
  },
  "libraries_and_scaffolds": {
    "framer_motion": {
      "usage": [
        "Hero jackpot counter pulse + number transitions",
        "Card hover glow (optional; CSS ok too)",
        "Locked-in receipt entrance"
      ],
      "implementation_notes": "Use motion.div wrappers in .js files. Keep animations subtle; avoid large transforms."
    },
    "recharts_optional": {
      "usage": "Dashboard mini chart for coin earnings over 7 days (optional).",
      "install": "npm i recharts",
      "style": "Gold line on dark surface; muted grid lines using rgba(255,255,255,0.06)."
    }
  },
  "instructions_to_main_agent": {
    "global": [
      "Replace shadcn default tokens in /app/frontend/src/index.css with CipherStakes tokens; ensure dark mode is default.",
      "Do not use transition: all anywhere. Use transition-colors, transition-shadow, transition-opacity only.",
      "Ensure every interactive element and key info element has data-testid in kebab-case.",
      "Use lucide-react icons (already typical with shadcn). Avoid emojis.",
      "Keep gradients minimal and only as ambient background blobs (<=20% viewport)."
    ],
    "page_build_order": [
      "1) Public shell + Landing hero with live jackpot counter",
      "2) Auth flows",
      "3) Draws grid + Draw detail + entry receipt",
      "4) Dashboard (daily claim + streak + entries + referral)",
      "5) Pack store tiers + Stripe redirect",
      "6) Results feed + pagination",
      "7) Profile + KYC winner flow",
      "8) How it works / FAQ"
    ]
  }
}

---

<General UI UX Design Guidelines>  
    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms
    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text
   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json

 **GRADIENT RESTRICTION RULE**
NEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc
NEVER use dark gradients for logo, testimonial, footer etc
NEVER let gradients cover more than 20% of the viewport.
NEVER apply gradients to text-heavy content or reading areas.
NEVER use gradients on small UI elements (<100px width).
NEVER stack multiple gradient layers in the same viewport.

**ENFORCEMENT RULE:**
    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors

**How and where to use:**
   • Section backgrounds (not content backgrounds)
   • Hero section header content. Eg: dark to light to dark color
   • Decorative overlays and accent elements only
   • Hero section with 2-3 mild color
   • Gradients creation can be done for any angle say horizontal, vertical or diagonal

- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**

</Font Guidelines>

- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. 
   
- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.

- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.
   
- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly
    Eg: - if it implies playful/energetic, choose a colorful scheme
           - if it implies monochrome/minimal, choose a black–white/neutral scheme

**Component Reuse:**
	- Prioritize using pre-existing components from src/components/ui when applicable
	- Create new components that match the style and conventions of existing components when needed
	- Examine existing components to understand the project's component patterns before creating new ones

**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component

**Best Practices:**
	- Use Shadcn/UI as the primary component library for consistency and accessibility
	- Import path: ./components/[component-name]

**Export Conventions:**
	- Components MUST use named exports (export const ComponentName = ...)
	- Pages MUST use default exports (export default function PageName() {...})

**Toasts:**
  - Use `sonner` for toasts"
  - Sonner component are located in `/app/src/components/ui/sonner.tsx`

Use 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.
</General UI UX Design Guidelines>
