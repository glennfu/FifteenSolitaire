#!/bin/bash

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick is not installed. Please install it or create the icon files manually."
    echo "You need to create the following files:"
    echo "- client/public/icon-192.png (192x192 pixels)"
    echo "- client/public/icon-512.png (512x512 pixels)"
    echo "- client/public/apple-touch-icon.png (180x180 pixels)"
    exit 1
fi

echo "Generating PWA icons for Fifteen Solitaire..."

# Create a temporary SVG file with a simple card design
cat > temp_icon.svg << EOF
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <!-- Card background -->
  <rect x="56" y="56" width="400" height="400" rx="20" fill="white" stroke="#8B4513" stroke-width="12"/>
  
  <!-- Card suit symbols -->
  <text x="256" y="256" font-family="Arial" font-size="200" text-anchor="middle" dominant-baseline="middle" fill="#8B4513">15</text>
  
  <!-- Corner symbols -->
  <text x="96" y="136" font-family="Arial" font-size="60" fill="#8B4513">♠</text>
  <text x="416" y="376" font-family="Arial" font-size="60" fill="#8B4513" text-anchor="end">♥</text>
</svg>
EOF

# Generate the different sized icons
convert -background none temp_icon.svg -resize 192x192 client/public/icon-192.png
convert -background none temp_icon.svg -resize 512x512 client/public/icon-512.png
convert -background none temp_icon.svg -resize 180x180 client/public/apple-touch-icon.png

# Remove the temporary SVG file
rm temp_icon.svg

echo "Icon generation complete!"
echo "Created:"
echo "- client/public/icon-192.png"
echo "- client/public/icon-512.png"
echo "- client/public/apple-touch-icon.png" 