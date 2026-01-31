# Product Image Mapping Reference

## Quick Visual Reference

This table shows the **correct** image-to-flavor mapping after all fixes:

**✅ Updated: January 31, 2026 - Now showing 9 flavors (Sweet Litchi and Bubble Gum removed)**

| Flavor Name | Correct Image File | Visual Description | Status |
|-------------|-------------------|--------------------|--------|
| **Tangy Orange** | `/blue-berry.jpg` | Vibrant orange colored slush | ✅ Active |
| **Exotic Pineapple** | `/sweet-litchi.jpg` | Yellow pineapple slush | ✅ Active (Updated) |
| **Icy Cola** | `/sour-green-apple.jpg` | Dark brown/cola colored slush | ✅ Active |
| **Sour Green Apple** | `/bubble-gum.jpg` | Bright green apple colored slush | ✅ Active |
| **Blue Berry** | `/exotic-pineapple.jpg` | Deep blue/purple berry slush | ✅ Active |
| **Simple Strawberry** | `/simple-strawberry.jpg` | Red/pink strawberry slush | ✅ Active |
| **Seven Rainbow** | `/seven-rainbow.jpg` | Multi-colored rainbow slush | ✅ Active |
| **Awesome Mango** | `/awesome-mango.jpg` | Yellow/orange mango slush | ✅ Active |
| **Power Blackberry** | `/tangy-orange.jpg` | Dark purple/blackberry slush | ✅ Active |
| ~~**Sweet Litchi**~~ | ~~`/sweet-litchi.jpg`~~ | ~~Pink/light colored slush~~ | ❌ Removed |
| ~~**Bubble Gum**~~ | ~~`/icy-cola.jpg`~~ | ~~Purple/pink bubble gum slush~~ | ❌ Removed |

---

## Files That Were NOT Changed

These 5 flavors had correct images from the start and remain active:

1. ✅ **Simple Strawberry** → `/simple-strawberry.jpg`
2. ✅ **Seven Rainbow** → `/seven-rainbow.jpg`
3. ✅ **Awesome Mango** → `/awesome-mango.jpg`

## Files That Were Updated

1. 🔄 **Exotic Pineapple** → Changed from `/exotic-pineapple.jpg` to `/sweet-litchi.jpg` (correct pineapple image)

---

## Flavors Removed (No Correct Images Available)

These 2 flavors were removed from the Products section on January 31, 2026:

1. ❌ **Sweet Litchi** - Removed (image file showed pineapple, not litchi)
2. ❌ **Bubble Gum** - Removed (image file showed green apple, not bubble gum)

They can be re-added once correct images are sourced.

---

## Files That WERE Swapped

These 6 flavors had incorrect image mappings that were corrected:

1. 🔄 **Tangy Orange** → Changed from `/tangy-orange.jpg` to `/blue-berry.jpg`
2. 🔄 **Icy Cola** → Changed from `/icy-cola.jpg` to `/sour-green-apple.jpg`
3. 🔄 **Sour Green Apple** → Changed from `/sour-green-apple.jpg` to `/bubble-gum.jpg`
4. 🔄 **Blue Berry** → Changed from `/blue-berry.jpg` to `/exotic-pineapple.jpg`
5. 🔄 **Bubble Gum** → Changed from `/bubble-gum.jpg` to `/icy-cola.jpg`
6. 🔄 **Power Blackberry** → Changed from `/power-blackberry.jpg` to `/tangy-orange.jpg`

---

## The Swap Pattern

The images formed a circular swap pattern:

```
tangy-orange.jpg → Power Blackberry (dark purple)
blue-berry.jpg → Tangy Orange (orange)
exotic-pineapple.jpg → Blue Berry (blue)
sour-green-apple.jpg → Icy Cola (cola brown)
bubble-gum.jpg → Sour Green Apple (green)
icy-cola.jpg → Bubble Gum (purple/pink)
```

---

## Verification Commands

To verify the correct images are displaying on production:

```bash
# Check the live site
curl -s https://london-slush.pages.dev/ | grep -o 'src="/[^"]*\.jpg"' | sort | uniq

# Expected output should include these image references:
# src="/blue-berry.jpg"        (for Tangy Orange)
# src="/exotic-pineapple.jpg"  (for Blue Berry & Exotic Pineapple)
# src="/sour-green-apple.jpg"  (for Icy Cola)
# src="/bubble-gum.jpg"        (for Sour Green Apple)
# src="/icy-cola.jpg"          (for Bubble Gum)
# src="/tangy-orange.jpg"      (for Power Blackberry)
# src="/sweet-litchi.jpg"      (for Sweet Litchi)
# src="/simple-strawberry.jpg" (for Simple Strawberry)
# src="/seven-rainbow.jpg"     (for Seven Rainbow)
# src="/awesome-mango.jpg"     (for Awesome Mango)
```

---

## Color Guide for Quick Verification

When viewing https://london-slush.pages.dev/#products:

**✅ Active Flavors (9 total):**

| Expected Color | Flavor Name |
|---------------|-------------|
| 🟠 Orange | Tangy Orange |
| 🟡 Yellow | Exotic Pineapple, Awesome Mango |
| 🟤 Brown/Cola | Icy Cola |
| 🟢 Green | Sour Green Apple |
| 🔵 Blue | Blue Berry |
| 🔴 Red/Pink | Simple Strawberry |
| 🌈 Rainbow | Seven Rainbow |
| 🟣 Dark Purple | Power Blackberry |

**❌ Removed Flavors (2):**

| Expected Color | Flavor Name | Reason |
|---------------|-------------|--------|
| ~~🩷 Light Pink~~ | ~~Sweet Litchi~~ | No correct image available |
| ~~🟣 Purple/Pink~~ | ~~Bubble Gum~~ | No correct image available |

---

**Document Created**: January 31, 2026  
**Last Updated**: January 31, 2026 (Updated for 9 flavors)  
**Status**: ✅ Current (9 active flavors, 2 removed)
