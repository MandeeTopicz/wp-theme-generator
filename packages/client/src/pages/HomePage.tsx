import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-24 text-center">
      <h2 className="text-5xl font-bold text-text1 mb-6">
        Build WordPress themes
        <span className="bg-gradient-to-r from-accent to-accent2 bg-clip-text text-transparent">
          {' '}
          with AI
        </span>
      </h2>
      <p className="text-text2 text-lg mb-12 max-w-2xl mx-auto">
        Describe your ideal theme in plain language. Our AI generates a complete
        WordPress block theme with valid markup, design tokens, and style
        variations — ready to install.
      </p>
      <Link
        to="/generate"
        className="inline-block px-8 py-4 bg-accent text-white font-semibold text-lg rounded-xl hover:bg-accent/90 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50"
      >
        Start Generating
      </Link>
      <div className="mt-20 grid grid-cols-3 gap-8 text-left">
        {[
          {
            title: 'Describe',
            desc: 'Tell the AI what kind of site you need — blog, portfolio, store, or anything else.',
            color: 'text-accent',
          },
          {
            title: 'Generate',
            desc: 'AI creates a full block theme with templates, patterns, and style variations.',
            color: 'text-accent2',
          },
          {
            title: 'Download',
            desc: 'Get a production-ready .zip you can install directly in WordPress.',
            color: 'text-accent3',
          },
        ].map((item) => (
          <div
            key={item.title}
            className="bg-bg2 border border-border rounded-xl p-6 hover:border-border2 transition-colors"
          >
            <h3 className={`font-semibold mb-2 ${item.color}`}>
              {item.title}
            </h3>
            <p className="text-text2 text-sm">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
