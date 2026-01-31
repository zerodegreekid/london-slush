# Product Image Mapping Reference

## Quick Visual Reference

This table shows the **correct** image-to-flavor mapping after fixes:

| Flavor Name | Correct Image File | Visual Description |
|-------------|-------------------|-------------------|
| **Tangy Orange** | `/blue-berry.jpg` | Vibrant orange colored slush |
| **Exotic Pineapple** | `/exotic-pineapple.jpg` | Yellow pineapple slush (unchanged) |
| **Icy Cola** | `/sour-green-apple.jpg` | Dark brown/cola colored slush |
| **Sweet Litchi** | `/sweet-litchi.jpg` | Pink/light colored slush (unchanged) |
| **Sour Green Apple** | `/bubble-gum.jpg` | Bright green apple colored slush |
| **Blue Berry** | `/exotic-pineapple.jpg` | Deep blue/purple berry slush |
| **Bubble Gum** | `/icy-cola.jpg` | Purple/pink bubble gum slush |
| **Simple Strawberry** | `/simple-strawberry.jpg` | Red/pink strawberry slush (unchanged) |
| **Seven Rainbow** | `/seven-rainbow.jpg` | Multi-colored rainbow slush (unchanged) |
| **Awesome Mango** | `/awesome-mango.jpg` | Yellow/orange mango slush (unchanged) |
| **Power Blackberry** | `/tangy-orange.jpg` | Dark purple/blackberry slush |

---

## Files That Were NOT Changed

These 5 flavors had correct images from the start:

1. ✅ **Exotic Pineapple** → `/exotic-pineapple.jpg`
2. ✅ **Sweet Litchi** → `/sweet-litchi.jpg`
3. ✅ **Simple Strawberry** → `/simple-strawberry.jpg`
4. ✅ **Seven Rainbow** → `/seven-rainbow.jpg`
5. ✅ **Awesome Mango** → `/awesome-mango.jpg`

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

| Expected Color | Flavor Name |
|---------------|-------------|
| 🟠 Orange | Tangy Orange |
| 🟡 Yellow | Exotic Pineapple, Awesome Mango |
| 🟤 Brown/Cola | Icy Cola |
| 🩷 Light Pink | Sweet Litchi |
| 🟢 Green | Sour Green Apple |
| 🔵 Blue | Blue Berry |
| 🟣 Purple/Pink | Bubble Gum |
| 🔴 Red/Pink | Simple Strawberry |
| 🌈 Rainbow | Seven Rainbow |
| 🟣 Dark Purple | Power Blackberry |

---

**Document Created**: January 31, 2026  
**Last Updated**: January 31, 2026  
**Status**: ✅ Current
