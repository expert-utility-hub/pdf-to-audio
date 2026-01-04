# PDF to Audio Converter

Convert any PDF file to audio and listen to your documents anywhere, anytime.

## Features

- **Instant PDF Conversion** - Upload any PDF and get audio in seconds
- **Natural Voice Synthesis** - High-quality text-to-speech powered by Web Speech API
- **Speed Control** - Adjust playback from 0.5x to 2x speed
- **Smart Chapters** - Navigate through long documents easily
- **Offline Library** - Save converted files to your personal library
- **Bookmarking** - Mark your favorite sections for quick access
- **Premium Voices** - Upgrade for 100+ realistic AI voices

## Getting Started

### Local Development

1. Clone this repository:
```bash
git clone https://github.com/your-org/pdf-to-audio.git
cd pdf-to-audio
```

2. Open `index.html` in your browser, or serve with a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .
```

3. Open http://localhost:8000

### Deployment to GitHub Pages

1. Create a GitHub repository
2. Push this code to the repository
3. Go to Settings > Pages
4. Select the `main` branch as source
5. Your site will be live at `https://your-org.github.io/repo-name/`

## Project Structure

```
pdf-to-audio/
├── index.html              # Main HTML file
├── styles/
│   ├── main.css           # Main styles
│   ├── components.css     # Component styles
│   └── responsive.css     # Responsive styles
├── scripts/
│   ├── app.js             # Main application
│   ├── utils.js           # Utility functions
│   ├── pdf-handler.js     # PDF text extraction
│   ├── tts-manager.js     # Text-to-speech
│   ├── library-manager.js # Library management
│   └── premium-manager.js # Premium subscriptions
├── lib/
│   ├── pdf.min.js         # PDF.js library
│   └── pdf.worker.min.js  # PDF.js worker
└── assets/
    └── favicon.svg        # App favicon
```

## Dependencies

- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF text extraction
- [Google Fonts](https://fonts.google.com/) - Inter font family

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 14+
- Edge 80+

Note: Text-to-speech quality varies by browser and operating system.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

For questions or issues, please open a GitHub issue.
