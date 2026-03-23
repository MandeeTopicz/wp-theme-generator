import ThemeForm from '../components/ThemeForm/ThemeForm'

export default function GeneratePage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h2 className="text-3xl font-bold text-white mb-2">
        Generate Your Theme
      </h2>
      <p className="text-white/50 mb-8">
        Walk through each step to describe your perfect WordPress theme.
      </p>
      <ThemeForm />
    </div>
  )
}
