# Mobile Menu Troubleshooting Guide

## Quick Test

### Step 1: Test the Demo Page
1. Open your browser to: `http://localhost:5173/test-mobile.html`
2. This is a standalone test page with just the mobile menu functionality
3. Click the red button (☰) - it should open a red sidebar from the left
4. If this works, the issue is specific to the React app

### Step 2: Test in React App
1. Open the main app: `http://localhost:5173`
2. Login to access the dashboard
3. Resize your browser window to less than 768px wide
4. Look for the red hamburger button (☰) in the top-left corner
5. Open browser DevTools (F12) and go to Console tab
6. Click the hamburger button
7. Check console for these messages:
   - "Toggle mobile menu clicked. Current state: false"
   - "Mobile menu state changed: true"

## Troubleshooting Checklist

### ✅ 1. Check Screen Width
- **Problem**: Button only appears on screens ≤768px
- **Solution**:
  - Press F12 → Click device toolbar icon
  - OR resize browser window to < 768px width
  - Check console: `window.innerWidth` should show < 768

### ✅ 2. Check if Button is Visible
- **Problem**: Button might be hidden behind other elements
- **Expected**: Red button at top-left with ☰ icon
- **Debug**:
  ```javascript
  // Run in console:
  document.querySelector('.mobile-menu-toggle')
  // Should return: <button class="mobile-menu-toggle">...</button>
  ```

### ✅ 3. Check if Click Handler Works
- **Problem**: JavaScript not attached
- **Debug**:
  ```javascript
  // Run in console:
  const btn = document.querySelector('.mobile-menu-toggle');
  console.log('Button found:', btn);
  console.log('Button onclick:', btn?.onclick);
  ```

### ✅ 4. Check Sidebar State
- **Problem**: Sidebar not responding to state changes
- **Debug**:
  ```javascript
  // Run in console after clicking button:
  const sidebar = document.querySelector('.sidebar');
  console.log('Sidebar classes:', sidebar?.className);
  // Should show: "sidebar active" when open
  ```

### ✅ 5. Check CSS Loading
- **Problem**: theme.css not loaded
- **Debug**:
  ```javascript
  // Run in console:
  const styles = getComputedStyle(document.querySelector('.mobile-menu-toggle'));
  console.log('Button display:', styles.display);
  console.log('Button position:', styles.position);
  // Should be: display: "flex", position: "fixed"
  ```

### ✅ 6. Check for CSS Conflicts
- **Problem**: Other CSS overriding styles
- **Solution**: Check for conflicting `!important` rules
- **Debug**: Inspect element → Computed tab → Check which styles apply

### ✅ 7. Check React State
- **Expected Console Logs**:
  ```
  Toggle mobile menu clicked. Current state: false
  Mobile menu state changed: true
  ```
- **If no logs**: Click handler not working
- **If logs but no sidebar**: CSS issue

## Common Issues & Solutions

### Issue 1: "I don't see the button at all"
**Causes:**
- Screen width > 768px
- CSS not loaded
- Button rendered but hidden

**Solutions:**
1. Resize window to < 768px
2. Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
3. Check DevTools Elements tab for `.mobile-menu-toggle`

### Issue 2: "Button visible but nothing happens when clicked"
**Causes:**
- JavaScript not loaded
- Event handler not attached
- Console errors blocking execution

**Solutions:**
1. Check Console tab for errors (red text)
2. Refresh page
3. Check if React app loaded properly

### Issue 3: "Sidebar opens but doesn't look right"
**Causes:**
- CSS transition not applied
- Z-index conflicts
- Width calculation issues

**Solutions:**
1. Check sidebar width in DevTools
2. Verify z-index values (sidebar: 1000, button: 1002)
3. Check for CSS `!important` conflicts

### Issue 4: "Button works on test page but not in React app"
**Causes:**
- React component state issue
- Event bubbling prevented
- Router interfering

**Solutions:**
1. Check console for React errors
2. Verify AuthProvider is working
3. Check if ProtectedRoute is interfering

## Browser-Specific Issues

### Chrome/Edge
- Usually works fine
- Check for extensions interfering (test in Incognito)

### Firefox
- Check if CSS Grid/Flexbox supported
- Test in private window

### Safari (iOS)
- May need `-webkit-` prefixes
- Check viewport meta tag

### Mobile Browsers
- Ensure touch events work
- Check `touchstart` vs `click` events

## Manual Testing Steps

### Desktop Browser:
1. Open http://localhost:5173
2. Login
3. Press F12 for DevTools
4. Click device toolbar (mobile icon)
5. Select "iPhone 12" or similar
6. Look for red button top-left
7. Click it - sidebar should slide in from left

### Mobile Device:
1. Connect phone to same WiFi as computer
2. Find computer's IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. On phone, go to: `http://YOUR_IP:5173`
4. Login
5. Look for red hamburger button
6. Tap it - menu should open

## CSS Debug Commands

Run these in browser console:

```javascript
// Check if button exists
console.log('Button:', document.querySelector('.mobile-menu-toggle'));

// Check button visibility
const btn = document.querySelector('.mobile-menu-toggle');
const styles = getComputedStyle(btn);
console.log({
  display: styles.display,
  position: styles.position,
  zIndex: styles.zIndex,
  top: styles.top,
  left: styles.left
});

// Check sidebar state
const sidebar = document.querySelector('.sidebar');
console.log('Sidebar classes:', sidebar?.className);
console.log('Sidebar left:', getComputedStyle(sidebar).left);

// Force open sidebar (test if CSS works)
sidebar.classList.add('active');

// Check screen width
console.log('Window width:', window.innerWidth);
console.log('Should show menu:', window.innerWidth <= 768);
```

## Still Not Working?

### Last Resort Fixes:

1. **Clear all caches**:
   ```bash
   # Stop dev server
   rm -rf node_modules/.vite
   npm run dev
   ```

2. **Hard refresh CSS**:
   - Ctrl+Shift+Delete → Clear cached images/files
   - Close all browser tabs
   - Restart browser

3. **Check for package issues**:
   ```bash
   npm install
   npm run dev
   ```

4. **Verify React is rendering**:
   ```javascript
   // In console:
   console.log('React root:', document.getElementById('root'));
   console.log('Dashboard container:', document.querySelector('.dashboard-container'));
   ```

## Expected Behavior

### When Working Correctly:

**Desktop (>768px):**
- ❌ No hamburger button visible
- ✅ Sidebar visible on left
- ✅ Can't hide sidebar

**Mobile (≤768px):**
- ✅ Red hamburger button top-left
- ✅ Sidebar hidden by default (left: -280px)
- ✅ Click button → sidebar slides in (left: 0)
- ✅ Dark overlay appears behind sidebar
- ✅ Click overlay or X → sidebar slides out

## Debug Output Template

If still having issues, provide this info:

```
Browser: Chrome/Firefox/Safari [version]
Screen width: [px]
Button visible: Yes/No
Console errors: [paste errors]
Console logs when clicking: [paste logs]
Button computed styles: [paste from CSS Debug Commands]
Sidebar classes: [paste]
React version: [from package.json]
```

## Contact Support

If none of this works, try:
1. Test demo page first: `/test-mobile.html`
2. Check browser console for errors
3. Provide debug output from above
4. Include screenshot of DevTools Elements tab showing button
