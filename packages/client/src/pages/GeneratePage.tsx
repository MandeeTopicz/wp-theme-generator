import ThemeForm from '../components/ThemeForm/ThemeForm'

export default function GeneratePage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <h2 className="text-2xl font-bold text-text1 mb-1">
        Generate Your Theme
      </h2>
      <p className="text-text2 text-sm mb-6">
        Walk through each step to describe your perfect WordPress theme.
      </p>
      <ThemeForm />
    </div>
  )
}
