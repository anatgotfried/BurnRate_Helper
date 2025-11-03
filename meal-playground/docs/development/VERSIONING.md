# Versioning Policy

**Every change = version bump!**

## Semantic Versioning: MAJOR.MINOR.PATCH

### PATCH (x.x.+1) - Bug Fixes, Tweaks
- Bug fixes
- CSS/styling tweaks
- Text/copy changes
- Small improvements
- **Example:** 1.3.1 → 1.3.2

### MINOR (x.+1.0) - New Features
- New features
- New UI components
- Significant improvements
- New documentation
- **Example:** 1.3.2 → 1.4.0

### MAJOR (+1.0.0) - Breaking Changes
- Breaking changes
- Major redesigns
- Architecture changes
- API changes
- **Example:** 1.4.0 → 2.0.0

---

## Files to Update

When bumping version, update ALL of these:

1. **`script.js`**
   ```javascript
   const VERSION = '1.3.2';
   const VERSION_DATE = '2025-01-02';
   ```

2. **`index.html`**
   ```html
   <span id="versionNumber">1.3.2</span>
   ```

3. **`VERSION.md`**
   - Add new version section at top
   - Document changes

4. **`script.js` - showChangelog()**
   - Update changelog text

5. **Git commit message**
   ```bash
   git commit -m "v1.3.2: Fix X, improve Y"
   ```

---

## Quick Version Bump Checklist

- [ ] Increment version in `script.js` (VERSION constant)
- [ ] Update date in `script.js` (VERSION_DATE)
- [ ] Update version in `index.html` (versionNumber span)
- [ ] Add entry to `VERSION.md`
- [ ] Update `showChangelog()` in `script.js`
- [ ] Commit with version in message: `v1.3.2: Description`

---

## Current Version
**v1.3.1** (2025-01-02)

## Next Version Will Be
**v1.3.2** (for next bug fix)
**v1.4.0** (for next feature)

