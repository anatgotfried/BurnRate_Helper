const NS = 'http://www.w3.org/2000/svg';
const TARGET_CENTER_X = 45;
const TARGET_CENTER_Y = -35;
const TARGET_WIDTH = 90;
const TARGET_HEIGHT = 90;

let files = [];
let convertedFiles = [];
let sizeMultiplier = 1.0; // Default 100%

// DOM references
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const filesSection = document.getElementById('filesSection');
const filesList = document.getElementById('filesList');
const fileCount = document.getElementById('fileCount');
const convertBtn = document.getElementById('convertBtn');
const resultsSection = document.getElementById('resultsSection');
const resultsList = document.getElementById('resultsList');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const sizeSlider = document.getElementById('sizeSlider');
const sizeValue = document.getElementById('sizeValue');
const sizePresets = document.querySelectorAll('.size-preset');
const regenerateBtn = document.getElementById('regenerateBtn');

browseBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    fileInput.click();
});

fileInput.addEventListener('change', (event) => {
    handleFiles(Array.from(event.target.files));
    fileInput.value = '';
});

dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.classList.remove('drag-over');
    const dropped = Array.from(event.dataTransfer.files).filter(file => file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg'));
    handleFiles(dropped);
});

convertBtn.addEventListener('click', convertAllFiles);
downloadAllBtn.addEventListener('click', downloadAllAsZip);
regenerateBtn.addEventListener('click', convertAllFiles);

// Size control event listeners
sizeSlider.addEventListener('input', updateSizeFromSlider);
sizePresets.forEach(preset => {
    preset.addEventListener('click', () => setSizeFromPreset(preset));
});

function handleFiles(newFiles) {
    const svgFiles = newFiles.filter(file => file.name.toLowerCase().endsWith('.svg'));
    const existingNames = new Set(files.map(file => file.name));

    svgFiles.forEach(file => {
        if (!existingNames.has(file.name)) {
            files.push(file);
        }
    });

    if (svgFiles.length === 0 && newFiles.length > 0) {
        showErrors([{ fileName: 'Upload', error: 'Only SVG files are supported. Convert raster artwork to vector before importing.' }]);
    }

    updateFilesList();
}

function updateFilesList() {
    filesSection.style.display = files.length ? 'block' : 'none';
    fileCount.textContent = files.length;
    filesList.innerHTML = '';

    files.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'file-item';

        const meta = document.createElement('div');
        meta.className = 'file-meta';

        const name = document.createElement('span');
        name.className = 'file-name';
        name.textContent = file.name;

        const size = document.createElement('span');
        size.className = 'file-size';
        size.textContent = formatFileSize(file.size);

        meta.appendChild(name);
        meta.appendChild(size);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = 'Remove';
        removeBtn.onclick = () => removeFile(index);

        item.appendChild(meta);
        item.appendChild(removeBtn);
        filesList.appendChild(item);
    });
}

function removeFile(index) {
    files.splice(index, 1);
    updateFilesList();
    if (files.length === 0) {
        resultsSection.style.display = 'none';
        convertedFiles = [];
    }
}

function formatFileSize(bytes) {
    if (!bytes) return '0 Bytes';
    const units = ['Bytes', 'KB', 'MB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const size = bytes / Math.pow(1024, index);
    return `${size.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

function updateSizeFromSlider() {
    const value = parseInt(sizeSlider.value);
    sizeValue.textContent = value;
    sizeMultiplier = value / 100;
    updatePresetButtons();
    
    // Update regenerate button text if results are displayed
    if (convertedFiles.length > 0) {
        regenerateBtn.textContent = `🔄 Regenerate (${value}%)`;
    }
}

function setSizeFromPreset(preset) {
    const size = parseInt(preset.dataset.size);
    sizeSlider.value = size;
    sizeValue.textContent = size;
    sizeMultiplier = size / 100;
    updatePresetButtons();
    
    // Update regenerate button text if results are displayed
    if (convertedFiles.length > 0) {
        regenerateBtn.textContent = `🔄 Regenerate (${size}%)`;
    }
}

function updatePresetButtons() {
    const currentSize = parseInt(sizeSlider.value);
    sizePresets.forEach(preset => {
        const presetSize = parseInt(preset.dataset.size);
        if (presetSize === currentSize) {
            preset.classList.add('active');
        } else {
            preset.classList.remove('active');
        }
    });
}

async function convertAllFiles() {
    if (files.length === 0) {
        return;
    }

    const isRegenerate = event && event.target === regenerateBtn;
    
    convertBtn.disabled = true;
    regenerateBtn.disabled = true;
    convertBtn.textContent = 'Converting…';
    if (isRegenerate) {
        regenerateBtn.textContent = '🔄 Regenerating…';
    }
    
    convertedFiles = [];
    resultsList.innerHTML = '';
    if (!isRegenerate) {
        resultsSection.style.display = 'none';
    }

    const errors = [];

    for (const file of files) {
        try {
            const svgText = await file.text();
            const result = convertSvgToTemplate(svgText, file.name);
            convertedFiles.push(result);
        } catch (error) {
            errors.push({ fileName: file.name, error: error.message });
            console.error(`Failed to convert ${file.name}:`, error);
        }
    }

    displayResults();

    if (errors.length) {
        showErrors(errors);
    }

    convertBtn.disabled = false;
    regenerateBtn.disabled = false;
    convertBtn.textContent = 'Convert All to SF Symbols';
    regenerateBtn.textContent = `🔄 Regenerate (${Math.round(sizeMultiplier * 100)}%)`;
}

function convertSvgToTemplate(svgText, originalName) {
    const parser = new DOMParser();
    const parsed = parser.parseFromString(svgText, 'image/svg+xml');
    const parseError = parsed.querySelector('parsererror');
    if (parseError) {
        throw new Error('The SVG file could not be parsed. Verify the markup is valid.');
    }

    const svg = parsed.documentElement;
    if (!svg || svg.tagName.toLowerCase() !== 'svg') {
        throw new Error('No <svg> root element found.');
    }

    const viewBox = deriveViewBox(svg);
    expandUseElements(svg);

    const sanitizedGroup = sanitizeSvgContent(svg);
    if (!sanitizedGroup || !sanitizedGroup.hasChildNodes()) {
        throw new Error('No drawable vector paths were found after normalising the SVG.');
    }

    const bbox = measureBoundingBox(sanitizedGroup, viewBox);

    if (!isFinite(bbox.width) || !isFinite(bbox.height) || bbox.width === 0 || bbox.height === 0) {
        throw new Error('Unable to calculate geometry for the SVG. Ensure the artwork contains filled paths.');
    }

    const sanitizedName = sanitizeSymbolName(originalName);
    const finalSvg = buildTemplateSvg({ sanitizedGroup, bbox, symbolName: sanitizedName });
    const previewSvg = buildPreviewSvg(sanitizedGroup, bbox);

    return {
        name: originalName,
        convertedSVG: finalSvg,
        previewSVG: previewSvg
    };
}

function deriveViewBox(svg) {
    const viewBoxAttr = svg.getAttribute('viewBox');
    if (viewBoxAttr) {
        const values = viewBoxAttr.trim().split(/\s+/).map(Number);
        if (values.length === 4 && values.every(v => !Number.isNaN(v))) {
            return values;
        }
    }

    const widthAttr = svg.getAttribute('width');
    const heightAttr = svg.getAttribute('height');

    if (widthAttr && heightAttr) {
        const width = parseFloat(widthAttr.replace(/px/i, ''));
        const height = parseFloat(heightAttr.replace(/px/i, ''));
        if (!Number.isNaN(width) && !Number.isNaN(height)) {
            return [0, 0, width, height];
        }
    }

    throw new Error('The SVG must define a viewBox or width/height so it can be scaled.');
}

function expandUseElements(svg) {
    const uses = Array.from(svg.querySelectorAll('use'));
    if (!uses.length) {
        return;
    }

    uses.forEach(use => {
        const href = use.getAttribute('href') || use.getAttribute('xlink:href');
        if (!href || !href.startsWith('#')) {
            throw new Error('Found a <use> element without a valid reference.');
        }

        const id = href.slice(1);
        const reference = svg.querySelector(`#${cssEscape(id)}`);
        if (!reference) {
            throw new Error(`The SVG references "${id}" which could not be resolved.`);
        }

        const clone = reference.cloneNode(true);
        const translateX = parseFloat(use.getAttribute('x') || '0');
        const translateY = parseFloat(use.getAttribute('y') || '0');
        const transforms = [];

        if (translateX || translateY) {
            transforms.push(`translate(${translateX},${translateY})`);
        }

        const useTransform = use.getAttribute('transform');
        if (useTransform) {
            transforms.push(useTransform);
        }

        const existingTransform = clone.getAttribute('transform');
        if (existingTransform) {
            transforms.push(existingTransform);
        }

        if (transforms.length) {
            clone.setAttribute('transform', transforms.join(' '));
        }

        if (clone.tagName.toLowerCase() === 'symbol') {
            const fragment = document.createDocumentFragment();
            Array.from(clone.childNodes).forEach(child => fragment.appendChild(child.cloneNode(true)));
            use.parentNode.replaceChild(fragment, use);
        } else {
            use.parentNode.replaceChild(clone, use);
        }
    });

    expandUseElements(svg);
}

function sanitizeSvgContent(svg) {
    const sanitizedGroup = document.createElementNS(NS, 'g');
    Array.from(svg.childNodes).forEach(node => {
        const sanitized = sanitizeNode(node);
        if (sanitized) {
            sanitizedGroup.appendChild(sanitized);
        }
    });
    return sanitizedGroup;
}

function sanitizeNode(node) {
    if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.COMMENT_NODE) {
        return null;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
        return null;
    }

    const tag = node.tagName.toLowerCase();

    const skipTags = ['defs', 'style', 'title', 'desc', 'metadata'];
    if (skipTags.includes(tag)) {
        return null;
    }

    const unsupported = ['clippath', 'mask', 'pattern', 'filter', 'foreignobject', 'script', 'lineargradient', 'radialgradient'];
    if (unsupported.includes(tag)) {
        throw new Error(`Unsupported element <${tag}> detected. Remove clip/mask/filter constructs before converting.`);
    }

    if (tag === 'g') {
        const group = document.createElementNS(NS, 'g');
        copyAttribute(node, group, 'transform');
        copyAttribute(node, group, 'opacity');
        Array.from(node.childNodes).forEach(child => {
            const sanitizedChild = sanitizeNode(child);
            if (sanitizedChild) {
                group.appendChild(sanitizedChild);
            }
        });
        return group.hasChildNodes() ? group : null;
    }

    if (tag === 'path' || tag === 'rect' || tag === 'circle' || tag === 'ellipse' || tag === 'polygon' || tag === 'polyline') {
        return buildSanitizedPath(node);
    }

    if (tag === 'line') {
        throw new Error('Line elements rely on strokes which SF Symbols does not accept. Outline the stroke to a filled path first.');
    }

    return null;
}

function buildSanitizedPath(element) {
    let path;
    const tag = element.tagName.toLowerCase();

    if (tag === 'path') {
        const d = element.getAttribute('d');
        if (!d) {
            throw new Error('Encountered a <path> without path data.');
        }
        path = document.createElementNS(NS, 'path');
        path.setAttribute('d', d);
    } else {
        path = shapeToPath(element);
    }

    applyMonochromeAttributes(path, element);
    copyAttribute(element, path, 'transform');
    copyAttribute(element, path, 'opacity');
    copyAttribute(element, path, 'fill-rule');
    copyAttribute(element, path, 'clip-rule');

    return path;
}

function applyMonochromeAttributes(targetPath, sourceElement) {
    const fill = (sourceElement.getAttribute('fill') || '').trim();
    const stroke = (sourceElement.getAttribute('stroke') || '').trim();

    if (fill.startsWith('url(') || stroke.startsWith('url(')) {
        throw new Error('Gradient fills or strokes are not supported in SF Symbols templates.');
    }

    if ((!fill || fill === 'none') && stroke && stroke !== 'none') {
        throw new Error('Stroke-only paths detected. Convert strokes to filled outlines before converting.');
    }

    targetPath.setAttribute('fill', 'currentColor');
    targetPath.removeAttribute('stroke');
    targetPath.removeAttribute('stroke-width');
    targetPath.removeAttribute('style');
    targetPath.setAttribute('class', 'monochrome-0');
}

function copyAttribute(source, target, attribute) {
    const value = source.getAttribute(attribute);
    if (value && value.trim().length) {
        target.setAttribute(attribute, value);
    }
}

function shapeToPath(element) {
    const tag = element.tagName.toLowerCase();
    const path = document.createElementNS(NS, 'path');

    if (tag === 'rect') {
        const x = parseFloat(element.getAttribute('x') || '0');
        const y = parseFloat(element.getAttribute('y') || '0');
        const width = parseFloat(element.getAttribute('width') || '0');
        const height = parseFloat(element.getAttribute('height') || '0');
        const rxAttr = element.getAttribute('rx');
        const ryAttr = element.getAttribute('ry');
        let rx = rxAttr ? parseFloat(rxAttr) : 0;
        let ry = ryAttr ? parseFloat(ryAttr) : rx;

        rx = Math.min(rx, width / 2);
        ry = Math.min(ry, height / 2);

        if (rx === 0 && ry === 0) {
            path.setAttribute('d', `M${x},${y} h${width} v${height} h-${width} Z`);
        } else {
            const right = x + width;
            const bottom = y + height;
            path.setAttribute('d', [
                `M${x + rx},${y}`,
                `H${right - rx}`,
                `A${rx},${ry} 0 0 1 ${right},${y + ry}`,
                `V${bottom - ry}`,
                `A${rx},${ry} 0 0 1 ${right - rx},${bottom}`,
                `H${x + rx}`,
                `A${rx},${ry} 0 0 1 ${x},${bottom - ry}`,
                `V${y + ry}`,
                `A${rx},${ry} 0 0 1 ${x + rx},${y}`,
                'Z'
            ].join(' '));
        }
        return path;
    }

    if (tag === 'circle') {
        const cx = parseFloat(element.getAttribute('cx') || '0');
        const cy = parseFloat(element.getAttribute('cy') || '0');
        const r = parseFloat(element.getAttribute('r') || '0');
        path.setAttribute('d', `M${cx + r},${cy} A${r},${r} 0 1 0 ${cx - r},${cy} A${r},${r} 0 1 0 ${cx + r},${cy} Z`);
        return path;
    }

    if (tag === 'ellipse') {
        const cx = parseFloat(element.getAttribute('cx') || '0');
        const cy = parseFloat(element.getAttribute('cy') || '0');
        const rx = parseFloat(element.getAttribute('rx') || '0');
        const ry = parseFloat(element.getAttribute('ry') || '0');
        path.setAttribute('d', `M${cx + rx},${cy} A${rx},${ry} 0 1 0 ${cx - rx},${cy} A${rx},${ry} 0 1 0 ${cx + rx},${cy} Z`);
        return path;
    }

    if (tag === 'polygon' || tag === 'polyline') {
        const pointsAttr = element.getAttribute('points');
        if (!pointsAttr) {
            throw new Error(`<${tag}> element is missing required "points" attribute.`);
        }
        const points = parsePoints(pointsAttr);
        if (points.length < 3) {
            throw new Error(`<${tag}> requires at least three coordinate pairs.`);
        }
        const commands = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x},${y}`);
        if (tag === 'polygon') {
            commands.push('Z');
        } else {
            commands.push(`L${points[0][0]},${points[0][1]}`, 'Z');
        }
        path.setAttribute('d', commands.join(' '));
        return path;
    }

    throw new Error(`Unsupported shape <${tag}> encountered.`);
}

function parsePoints(pointsString) {
    const raw = pointsString.trim().split(/\s+/);
    const points = [];
    raw.forEach(pair => {
        const [x, y] = pair.split(',').map(Number);
        if (!Number.isNaN(x) && !Number.isNaN(y)) {
            points.push([x, y]);
        }
    });
    return points;
}

function measureBoundingBox(group, viewBox) {
    const measurementSvg = document.createElementNS(NS, 'svg');
    measurementSvg.setAttribute('viewBox', viewBox.join(' '));
    measurementSvg.setAttribute('xmlns', NS);
    measurementSvg.style.position = 'absolute';
    measurementSvg.style.width = '0';
    measurementSvg.style.height = '0';
    measurementSvg.style.opacity = '0';
    measurementSvg.style.pointerEvents = 'none';

    const clone = group.cloneNode(true);
    measurementSvg.appendChild(clone);
    document.body.appendChild(measurementSvg);
    const bbox = clone.getBBox();
    document.body.removeChild(measurementSvg);
    return bbox;
}

function buildTemplateSvg({ sanitizedGroup, bbox, symbolName }) {
    const skeleton = getTemplateSkeleton();
    const parser = new DOMParser();
    const templateDoc = parser.parseFromString(skeleton, 'image/svg+xml');
    const svg = templateDoc.documentElement;

    const scale = computeScaleFactor(bbox);
    const variants = [
        { id: 'Ultralight-S', multiplier: 0.96 },
        { id: 'Regular-S', multiplier: 1.0 },
        { id: 'Black-S', multiplier: 1.06 }
    ];

    variants.forEach(variant => {
        const group = templateDoc.getElementById(variant.id);
        while (group.firstChild) {
            group.removeChild(group.firstChild);
        }
        const wrapper = templateDoc.createElementNS(NS, 'g');
        wrapper.setAttribute('transform', composeTransform(scale * variant.multiplier, bbox));
        wrapper.appendChild(sanitizedGroup.cloneNode(true));
        group.appendChild(wrapper);
    });

    const serializer = new XMLSerializer();
    const serialized = serializer.serializeToString(svg);

    const header = '<?xml version="1.0" encoding="UTF-8"?>';
    const generatorComment = '<!--Generator: SF Symbols Custom Symbol Converter (BurnRate)-->';
    const glyphComment = `<!--glyph: "${symbolName}", template version: 7.0-->`;
    const doctype = '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

    return `${header}\n${generatorComment}\n${glyphComment}\n${doctype}\n${serialized}`;
}

function computeScaleFactor(bbox) {
    const width = bbox.width || 1;
    const height = bbox.height || 1;
    const cappedWidth = Math.max(width, 1);
    const cappedHeight = Math.max(height, 1);
    const widthScale = TARGET_WIDTH / cappedWidth;
    const heightScale = TARGET_HEIGHT / cappedHeight;
    const baseScale = Math.min(widthScale, heightScale);
    return baseScale * sizeMultiplier;
}

function composeTransform(scale, bbox) {
    const centerX = bbox.x + bbox.width / 2;
    const centerY = bbox.y + bbox.height / 2;
    const scaleValue = Math.max(scale, 1e-6);
    return `translate(${TARGET_CENTER_X}, ${TARGET_CENTER_Y}) scale(${scaleValue}, ${scaleValue}) translate(${-centerX}, ${-centerY})`;
}

function buildPreviewSvg(sanitizedGroup, bbox) {
    const previewSvg = document.createElementNS(NS, 'svg');
    previewSvg.setAttribute('xmlns', NS);
    previewSvg.setAttribute('viewBox', '0 0 100 100');
    const wrapper = sanitizedGroup.cloneNode(true);
    const width = bbox.width || 1;
    const height = bbox.height || 1;
    const baseScale = Math.min(80 / width, 80 / height);
    const scale = baseScale * sizeMultiplier;
    const centerX = bbox.x + width / 2;
    const centerY = bbox.y + height / 2;
    wrapper.setAttribute('transform', `translate(50, 50) scale(${scale}) translate(${-centerX}, ${-centerY})`);
    previewSvg.appendChild(wrapper);
    return new XMLSerializer().serializeToString(previewSvg);
}

function getTemplateSkeleton() {
    return `
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 3300 2200">
  <style>.defaults {-sfsymbols-draw-reverses-motion-groups:false}

.monochrome-0 {-sfsymbols-motion-group:1;-sfsymbols-layer-tags:primary}
.monochrome-1 {-sfsymbols-motion-group:0;-sfsymbols-layer-tags:primary}

.multicolor-0:tintColor {-sfsymbols-motion-group:1;-sfsymbols-layer-tags:primary}
.multicolor-1:tintColor {-sfsymbols-motion-group:0;-sfsymbols-layer-tags:primary}

.hierarchical-0:primary {-sfsymbols-motion-group:1;-sfsymbols-layer-tags:primary}
.hierarchical-1:primary {-sfsymbols-motion-group:0;-sfsymbols-layer-tags:primary}

.SFSymbolsPreviewWireframe {fill:none;opacity:1.0;stroke:black;stroke-width:0.5}
</style>
  <g id="Notes">
    <rect height="2200" id="artboard" style="fill:white;opacity:1" width="3300" x="0" y="0"/>
    <line style="fill:none;stroke:black;opacity:1;stroke-width:0.5;" x1="263" x2="3036" y1="292" y2="292"/>
    <text style="stroke:none;fill:black;font-family:sans-serif;font-size:13;font-weight:bold;" transform="matrix(1 0 0 1 263 322)">Weight/Scale Variations</text>
    <text style="stroke:none;fill:black;font-family:sans-serif;font-size:13;text-anchor:end;" transform="matrix(1 0 0 1 3036 1933)" id="template-version">Template v.7.0</text>
  </g>
  <g id="Guides">
    <line id="Baseline-S" style="fill:none;stroke:#27AAE1;opacity:1;stroke-width:0.5;" x1="263" x2="3036" y1="696" y2="696"/>
    <line id="Capline-S" style="fill:none;stroke:#27AAE1;opacity:1;stroke-width:0.5;" x1="263" x2="3036" y1="625.541" y2="625.541"/>
    <line id="Baseline-M" style="fill:none;stroke:#27AAE1;opacity:1;stroke-width:0.5;" x1="263" x2="3036" y1="1126" y2="1126"/>
    <line id="Capline-M" style="fill:none;stroke:#27AAE1;opacity:1;stroke-width:0.5;" x1="263" x2="3036" y1="1055.54" y2="1055.54"/>
    <line id="Baseline-L" style="fill:none;stroke:#27AAE1;opacity:1;stroke-width:0.5;" x1="263" x2="3036" y1="1556" y2="1556"/>
    <line id="Capline-L" style="fill:none;stroke:#27AAE1;opacity:1;stroke-width:0.5;" x1="263" x2="3036" y1="1485.54" y2="1485.54"/>
    <line id="left-margin-Ultralight-S" style="fill:none;stroke:#00AEEF;stroke-width:0.5;opacity:1.0;" x1="517.088" x2="517.088" y1="600.785" y2="720.121"/>
    <line id="right-margin-Ultralight-S" style="fill:none;stroke:#00AEEF;stroke-width:0.5;opacity:1.0;" x1="602.334" x2="602.334" y1="600.785" y2="720.121"/>
    <line id="left-margin-Regular-S" style="fill:none;stroke:#00AEEF;stroke-width:0.5;opacity:1.0;" x1="1404.68" x2="1404.68" y1="600.785" y2="720.121"/>
    <line id="right-margin-Regular-S" style="fill:none;stroke:#00AEEF;stroke-width:0.5;opacity:1.0;" x1="1495.01" x2="1495.01" y1="600.785" y2="720.121"/>
    <line id="left-margin-Black-S" style="fill:none;stroke:#00AEEF;stroke-width:0.5;opacity:1.0;" x1="2884.86" x2="2884.86" y1="600.785" y2="720.121"/>
    <line id="right-margin-Black-S" style="fill:none;stroke:#00AEEF;stroke-width:0.5;opacity:1.0;" x1="2981.94" x2="2981.94" y1="600.785" y2="720.121"/>
  </g>
  <g id="Symbols">
    <g id="Ultralight-S" transform="matrix(1 0 0 1 517.088 696)"></g>
    <g id="Regular-S" transform="matrix(1 0 0 1 1404.68 696)"></g>
    <g id="Black-S" transform="matrix(1 0 0 1 2884.86 696)"></g>
  </g>
</svg>`;
}

function sanitizeSymbolName(fileName) {
    const base = fileName.replace(/\.[^/.]+$/, '');
    return base.replace(/[^a-zA-Z0-9._-]+/g, '-');
}

function cssEscape(value) {
    if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
        return CSS.escape(value);
    }
    return value.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}

function displayResults() {
    resultsList.innerHTML = '';

    convertedFiles.forEach(file => {
        const item = document.createElement('div');
        item.className = 'result-item';

        const previewContainer = document.createElement('div');
        previewContainer.className = 'preview-container';
        previewContainer.innerHTML = file.previewSVG;

        const name = document.createElement('div');
        name.className = 'result-name';
        name.textContent = file.name.replace(/\.svg$/i, '_symbol.svg');

        const note = document.createElement('div');
        note.className = 'result-note';
        note.textContent = 'Includes Ultralight / Regular / Black masters with SF Symbols guides.';

        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'download-btn';
        downloadBtn.textContent = 'Download';
        downloadBtn.onclick = () => downloadFile(file);

        item.appendChild(previewContainer);
        item.appendChild(name);
        item.appendChild(note);
        item.appendChild(downloadBtn);
        resultsList.appendChild(item);
    });

    if (convertedFiles.length) {
        resultsSection.style.display = 'block';
        downloadAllBtn.style.display = convertedFiles.length > 1 ? 'inline-block' : 'none';
        regenerateBtn.textContent = `🔄 Regenerate (${Math.round(sizeMultiplier * 100)}%)`;
    } else {
        resultsSection.style.display = 'none';
    }
}

function downloadFile(file) {
    const blob = new Blob([file.convertedSVG], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name.replace(/\.svg$/i, '_symbol.svg');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

async function downloadAllAsZip() {
    if (!convertedFiles.length) {
        return;
    }

    const zip = new JSZip();
    convertedFiles.forEach(file => {
        const filename = file.name.replace(/\.svg$/i, '_symbol.svg');
        zip.file(filename, file.convertedSVG);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sf-symbols-converted.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function showErrors(errors) {
    const existing = document.querySelector('.error-container');
    if (existing) {
        existing.remove();
    }

    const container = document.createElement('div');
    container.className = 'error-container';
    container.innerHTML = `
        <h3>⚠️ Conversion Issues</h3>
        <p>${errors.length} file(s) need attention:</p>
        <ul>
            ${errors.map(error => `<li><strong>${error.fileName}</strong>: ${error.error}</li>`).join('')}
        </ul>
        <button type="button">Dismiss</button>
    `;

    container.querySelector('button').addEventListener('click', () => container.remove());
    resultsSection.parentNode.insertBefore(container, resultsSection);
}
