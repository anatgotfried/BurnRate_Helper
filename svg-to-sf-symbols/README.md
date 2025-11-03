# SVG to SF Symbol Converter

A simple web app to convert SVG files into SF Symbol-compatible format for use with Apple's SF Symbols app.

## Features

- 🎨 **Drag & Drop Interface** - Simply drag your SVG files into the browser
- 📦 **Batch Processing** - Convert multiple SVGs at once
- 🎯 **Automatic Optimization** - Removes colors, optimizes paths, and centers content
- 💾 **Easy Download** - Download individual files or all as a ZIP
- 📱 **Responsive Design** - Works on desktop and mobile devices

## How to Use

1. **Open the App**
   - Simply open `index.html` in any modern web browser
   - No installation or build process required!

        2. **Add Your SVG or PNG Files**
           - Drag and drop SVG or PNG files into the upload area
           - Or click "Browse Files" to select files manually
           - You can add multiple files at once
           - **PNG files are converted to simple rectangle paths** (SF Symbols doesn't support raster images)
           - For best results with PNG files, consider converting them to vector SVG format first

        3. **Configure Options** (Optional)
           - ✅ Remove colors (make monochrome) - Recommended for standard symbols
           - ⚠️ Preserve colors for complex SVGs - Use if monochrome creates black boxes
           - ✅ Optimize paths - Simplifies and reduces file size
           - ✅ Center content in viewBox - Makes it square and centered

4. **Convert**
   - Click "Convert All to SF Symbols"
   - Files are validated before conversion - errors will be displayed
   - Invalid or corrupted files won't proceed to conversion
   - Preview the successfully converted symbols

5. **Download**
   - Download individual symbols or all as a ZIP file
   - Import the converted .svg files into Apple's SF Symbols app

## What It Does

The converter automatically creates a **complete SF Symbols template** with:
- ✅ Proper XML declaration and DOCTYPE
- ✅ Template version 7.0 structure (compatible with Xcode 17+)
- ✅ Required Notes, Guides, and Symbols groups
- ✅ Baseline and capline guides
- ✅ Margin guidelines
- ✅ Proper CSS classes for monochrome/hierarchical rendering
- ✅ Your content scaled and positioned correctly
- ✅ Converts colors to monochrome (optional)
- ✅ Optimizes paths (optional)
        - ✅ **Supports both SVG and PNG files** (PNG converted to simple rectangles)
        - ✅ **Comprehensive error handling** - won't proceed if files are invalid

## SF Symbols App Integration

After converting your SVGs with this tool:

1. Open **SF Symbols app** (download from Apple Developer if needed)
2. Go to **File > Import Custom Symbol Template...**
3. Select your converted .svg file(s)
4. **That's it!** Your symbol should import without errors! 🎉

### What This Tool Now Does

This converter now **generates the complete SF Symbols template structure** that Apple requires, including:
- Full template v7.0 format
- All required groups (Notes, Guides, Symbols)
- Proper baseline and margin guides
- Correct CSS styling classes
- Your artwork automatically scaled and positioned

**No manual template copying needed!** The tool does everything automatically.

## Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection (for JSZip CDN only)

## Technical Details

- Pure JavaScript (no frameworks required)
- Uses native browser APIs for SVG parsing
- JSZip for batch downloads
- Fully client-side processing (no server required)

## Tips for Best Results

- Use simple, clean SVG designs
- Avoid complex gradients and effects
- Ensure paths are merged and simplified in your design tool first
- Test with monochrome option enabled for standard symbols
- Square aspect ratios work best (1:1)

## License

Free to use for personal and commercial projects.

