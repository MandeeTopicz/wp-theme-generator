import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-24 text-center">
      <h2 className="text-5xl font-bold text-white mb-6">
        Build WordPress themes
        <span className="text-[#e94560]"> with AI</span>
      </h2>
      <p className="text-white/60 text-lg mb-12 max-w-2xl mx-auto">
        Describe your ideal theme in plain language. Our AI generates a complete
        WordPress block theme with valid markup, design tokens, and style
        variations — ready to install.
      </p>
      <Link
        to="/generate"
        className="inline-block px-8 py-4 bg-[#e94560] text-white font-semibold text-lg rounded-xl hover:bg-[#d63a54] transition-colors focus:outline-none focus:ring-2 focus:ring-[#e94560]/50"
      >
        Start Generating
      </Link>
      <div className="mt-20 grid grid-cols-3 gap-8 text-left">
        {[
          {
            title: 'Describe',
            desc: 'Tell the AI what kind of site you need — blog, portfolio, store, or anything else.',
          },
          {
            title: 'Generate',
            desc: 'AI creates a full block theme with templates, patterns, and style variations.',
          },
          {
            title: 'Download',
            desc: 'Get a production-ready .zip you can install directly in WordPress.',
          },
        ].map((item) => (
          <div key={item.title} className="bg-[#16213e] rounded-xl p-6">
            <h3 className="text-white font-semibold mb-2">{item.title}</h3>
            <p className="text-white/50 text-sm">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
