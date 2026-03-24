import { useState, useRef, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react'
import type { PlaygroundClient } from '@wp-playground/client'

export interface PlaygroundPreviewHandle {
  reloadTheme: () => Promise<void>
}

interface Props {
  sessionId: string
  themeSlug: string
}

type Status = 'loading' | 'active' | 'updating' | 'error'
type LoadingStep = 'wordpress' | 'installing' | 'activating'
type Viewport = 'mobile' | 'tablet' | 'desktop'
type Page = 'front' | 'blog' | 'sample'

const REMOTE_URL = 'https://playground.wordpress.net/remote.html'

const pagePaths: Record<Page, string> = {
  front: '/',
  blog: '/blog/',
  sample: '/sample-page/',
}

const loadingSteps: { key: LoadingStep; label: string }[] = [
  { key: 'wordpress', label: 'Starting WordPress...' },
  { key: 'installing', label: 'Installing theme...' },
  { key: 'activating', label: 'Activating theme...' },
]

function TrafficLights() {
  return (
    <div className="flex items-center gap-[5px]">
      <div className="w-[9px] h-[9px] rounded-full bg-[#ff5f56]" />
      <div className="w-[9px] h-[9px] rounded-full bg-[#ffbd2e]" />
      <div className="w-[9px] h-[9px] rounded-full bg-[#27c93f]" />
    </div>
  )
}

const PlaygroundPreview = forwardRef<PlaygroundPreviewHandle, Props>(function PlaygroundPreview({ sessionId, themeSlug }, ref) {
  const [status, setStatus] = useState<Status>('loading')
  const [currentStep, setCurrentStep] = useState<LoadingStep>('wordpress')
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [activePage, setActivePage] = useState<Page>('front')
  const [currentUrl, setCurrentUrl] = useState('/')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const clientRef = useRef<PlaygroundClient | null>(null)
  const launchedRef = useRef(false)

  const boot = useCallback(async () => {
    if (launchedRef.current) return
    launchedRef.current = true

    setStatus('loading')
    setCurrentStep('wordpress')

    // Wait for React to render the iframe into the DOM
    await new Promise((r) => setTimeout(r, 0))

    if (!iframeRef.current) {
      setStatus('error')
      launchedRef.current = false
      return
    }

    try {
      const zipRes = await fetch(`/api/playground/${sessionId}`)
      if (!zipRes.ok) throw new Error('Failed to fetch theme')
      const zipBlob = await zipRes.blob()
      const zipFile = new File([zipBlob], `${themeSlug}.zip`, {
        type: 'application/zip',
      })

      const wpPlayground = await import('@wp-playground/client')
      const { startPlaygroundWeb } = wpPlayground
      const { installTheme, activateTheme } = wpPlayground as unknown as {
        installTheme: (
          client: PlaygroundClient,
          opts: { themeData: File },
        ) => Promise<void>
        activateTheme: (
          client: PlaygroundClient,
          opts: { themeFolderName: string },
        ) => Promise<void>
      }

      const client = await startPlaygroundWeb({
        iframe: iframeRef.current,
        remoteUrl: REMOTE_URL,
      })

      setCurrentStep('installing')
      await installTheme(client, { themeData: zipFile })

      setCurrentStep('activating')
      await activateTheme(client, { themeFolderName: themeSlug })

      // Seed sample content so the preview isn't an empty site
      const docRoot = await client.documentRoot
      const slug = themeSlug.replace(/'/g, "\\'")
      await client.run({
        code: `<?php
include '${docRoot}/wp-load.php';
update_option('blogname', '${slug} Preview');
update_option('blogdescription', 'Theme preview powered by WordPress Playground');

$front = wp_insert_post(array(
  'post_title' => 'Home',
  'post_content' => '<!-- wp:heading {"level":1} -->
<h1>Welcome to Your New Theme</h1>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>This is a live preview of your generated WordPress block theme.</p>
<!-- /wp:paragraph -->

<!-- wp:columns -->
<div class="wp-block-columns"><!-- wp:column -->
<div class="wp-block-column"><!-- wp:heading {"level":3} -->
<h3>Beautiful Design</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>A carefully crafted design system with custom colors, fonts, and spacing.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:heading {"level":3} -->
<h3>Block Patterns</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Pre-built patterns for professional layouts.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:heading {"level":3} -->
<h3>Fully Customizable</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Adjust everything through the WordPress Site Editor.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->',
  'post_status' => 'publish',
  'post_type' => 'page',
));
update_option('show_on_front', 'page');
update_option('page_on_front', $front);
update_option('permalink_structure', '/%postname%/');
flush_rewrite_rules();

wp_insert_post(array('post_title'=>'Getting Started','post_content'=>'<!-- wp:paragraph --><p>Congratulations on your new WordPress theme! This post shows how blog content looks with your chosen typography and colors.</p><!-- /wp:paragraph -->','post_status'=>'publish'));
wp_insert_post(array('post_title'=>'Exploring Block Patterns','post_content'=>'<!-- wp:paragraph --><p>Block patterns are pre-designed layouts you can insert into any page or post.</p><!-- /wp:paragraph -->','post_status'=>'publish'));
wp_insert_post(array('post_title'=>'Customizing Your Design','post_content'=>'<!-- wp:paragraph --><p>Use the WordPress Site Editor to customize colors, typography, and layouts.</p><!-- /wp:paragraph -->','post_status'=>'publish'));

$sample = wp_insert_post(array('post_title'=>'Sample Page','post_content'=>'<!-- wp:heading --><h2>About This Theme</h2><!-- /wp:heading --><!-- wp:paragraph --><p>This sample page demonstrates how your theme renders static page content.</p><!-- /wp:paragraph -->','post_status'=>'publish','post_type'=>'page'));
$blog = wp_insert_post(array('post_title'=>'Blog','post_content'=>'','post_status'=>'publish','post_type'=>'page'));
update_option('page_for_posts', $blog);
echo 'done';
`,
      })

      await client.goTo('/')

      clientRef.current = client
      setActivePage('front')
      setCurrentUrl('/')
      setStatus('active')
    } catch (err) {
      console.error('Playground failed to load:', err)
      setStatus('error')
      launchedRef.current = false
    }
  }, [sessionId, themeSlug])

  // Auto-launch immediately on mount
  useEffect(() => {
    boot()
  }, [boot])

  const retry = useCallback(() => {
    launchedRef.current = false
    boot()
  }, [boot])

  const navigateTo = useCallback(async (page: Page) => {
    const client = clientRef.current
    if (!client) return
    setActivePage(page)
    setCurrentUrl(pagePaths[page])
    await client.goTo(pagePaths[page])
  }, [])

  const reload = useCallback(async () => {
    const client = clientRef.current
    if (!client) return
    await client.goTo(pagePaths[activePage])
  }, [activePage])

  const reloadTheme = useCallback(async () => {
    const client = clientRef.current
    if (!client) return
    setStatus('updating')
    try {
      const zipRes = await fetch(`/api/playground/${sessionId}`)
      if (!zipRes.ok) throw new Error('Failed to fetch updated theme')
      const zipBlob = await zipRes.blob()
      const zipFile = new File([zipBlob], `${themeSlug}.zip`, {
        type: 'application/zip',
      })
      const wpPlayground = await import('@wp-playground/client')
      const { installTheme, activateTheme } = wpPlayground as unknown as {
        installTheme: (c: PlaygroundClient, o: { themeData: File }) => Promise<void>
        activateTheme: (c: PlaygroundClient, o: { themeFolderName: string }) => Promise<void>
      }
      await installTheme(client, { themeData: zipFile })
      await activateTheme(client, { themeFolderName: themeSlug })
      await client.goTo(pagePaths[activePage])
    } catch (err) {
      console.error('Failed to reload theme:', err)
    } finally {
      setStatus('active')
    }
  }, [sessionId, themeSlug, activePage])

  useImperativeHandle(ref, () => ({ reloadTheme }), [reloadTheme])

  const showIframe = status === 'loading' || status === 'active' || status === 'updating'

  return (
    <div className="relative h-full flex flex-col">
      {/* Error state */}
      {status === 'error' && (
        <div className="flex-1 flex flex-col items-center justify-center py-16">
          <div className="w-14 h-14 mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <span className="text-red-400 text-2xl font-bold">!</span>
          </div>
          <h3 className="text-text1 text-lg font-semibold mb-2">
            Preview Unavailable
          </h3>
          <p className="text-text2 text-sm mb-6 text-center max-w-xs">
            WordPress Playground could not be loaded. This can happen due to
            network issues or browser restrictions.
          </p>
          <button
            onClick={retry}
            className="px-5 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Browser chrome + iframe wrapper — single iframe persists across loading and active */}
      {showIframe && (
        <div className="relative flex-1 flex flex-col rounded-xl border border-border2 overflow-hidden m-4">
          {/* Loading overlay — fully opaque bg-bg1, only in DOM when status === 'loading' */}
          {status === 'loading' && (
            <div className="absolute inset-0 z-10 bg-bg1 flex flex-col items-center justify-center" style={{ display: status === 'loading' ? undefined : 'none' }}>
              <div className="w-10 h-10 mb-6 border-2 border-border border-t-accent rounded-full animate-spin" />
              <div className="space-y-3 w-full max-w-xs">
                {loadingSteps.map((step, i) => {
                  const stepIndex = loadingSteps.findIndex(
                    (s) => s.key === currentStep,
                  )
                  const isActive = i === stepIndex
                  const isDone = i < stepIndex
                  return (
                    <div
                      key={step.key}
                      className={`flex items-center gap-3 transition-opacity duration-300 ${
                        isDone
                          ? 'opacity-40'
                          : isActive
                            ? 'opacity-100'
                            : 'opacity-20'
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isDone
                            ? 'bg-green'
                            : isActive
                              ? 'bg-accent'
                              : 'bg-text3'
                        }`}
                      />
                      <span className="text-text1 text-sm">{step.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Updating overlay — only in DOM when status === 'updating' */}
          {status === 'updating' && (
            <div className="absolute inset-0 z-10 bg-bg1/80 flex items-center justify-center backdrop-blur-sm" style={{ display: status === 'updating' ? undefined : 'none' }}>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-border border-t-accent rounded-full animate-spin" />
                <span className="text-text1 text-sm">Updating preview...</span>
              </div>
            </div>
          )}

          {/* Browser toolbar — always full width, visible when active or updating */}
          {(status === 'active' || status === 'updating') && (
            <div className="flex items-center gap-3 px-4 py-2.5 bg-bg1 border-b border-border shrink-0">
              <TrafficLights />

              <div className="flex-1 flex items-center gap-2 bg-bg3 rounded-md px-3 py-1.5">
                <svg className="w-3 h-3 text-green shrink-0" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1a5 5 0 00-5 5v2a2 2 0 00-1 1.73V13a2 2 0 002 2h8a2 2 0 002-2V9.73A2 2 0 0013 8V6a5 5 0 00-5-5zm3 5v2H5V6a3 3 0 116 0z" />
                </svg>
                <span className="text-text2 text-xs font-mono truncate">
                  localhost:8080{currentUrl}
                </span>
              </div>

              <div className="flex gap-1">
                {(
                  [
                    { key: 'front', label: 'Home' },
                    { key: 'blog', label: 'Blog' },
                    { key: 'sample', label: 'Sample Page' },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.key}
                    onClick={() => navigateTo(p.key)}
                    className={`px-2.5 py-1 text-[11px] rounded-full transition-colors focus:outline-none ${
                      activePage === p.key
                        ? 'bg-accent/10 text-accent'
                        : 'text-text3 hover:text-text2'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-0.5 bg-bg2 rounded p-0.5">
                {(
                  [
                    { key: 'desktop', label: 'D', title: 'Desktop' },
                    { key: 'tablet', label: 'T', title: 'Tablet (768px)' },
                    { key: 'mobile', label: 'M', title: 'Mobile (375px)' },
                  ] as const
                ).map((v) => (
                  <button
                    key={v.key}
                    title={v.title}
                    onClick={() => setViewport(v.key)}
                    className={`w-6 h-6 text-[10px] font-medium rounded transition-colors focus:outline-none ${
                      viewport === v.key
                        ? 'bg-accent3 text-bg0'
                        : 'text-text3 hover:text-text2'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>

              <button
                onClick={reload}
                title="Reload"
                className="w-6 h-6 flex items-center justify-center text-text3 hover:text-text2 transition-colors focus:outline-none"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M14 1v5h-5l1.94-1.94A4.5 4.5 0 008 3.5a4.5 4.5 0 100 9 4.5 4.5 0 003.18-1.32l1.42 1.42A6.5 6.5 0 118 1.5c1.56 0 3 .55 4.12 1.47L14 1z" />
                </svg>
              </button>
            </div>
          )}

          {/* NO overlays should exist in the DOM when status === 'active' */}
          {/* Iframe container — only background is #060608 dark surround for tablet/mobile viewports */}
          <div
            className="flex-1 overflow-hidden flex justify-center items-start"
            style={{
              background: viewport === 'desktop' ? '#ffffff' : '#060608',
              minHeight: '500px',
            }}
          >
            <iframe
              ref={iframeRef}
              title="WordPress Playground"
              className="border-0 shrink-0 transition-[width] duration-300"
              style={{
                width: viewport === 'desktop' ? '100%' : viewport === 'tablet' ? '768px' : '375px',
                height: '100%',
              }}
            />
          </div>

          {/* Powered by bar */}
          {(status === 'active' || status === 'updating') && (
            <div className="flex items-center justify-center gap-1.5 py-1.5 bg-bg1 border-t border-border shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-green" />
              <span className="text-text3 text-[10px]">
                Powered by WordPress Playground
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
})

export default PlaygroundPreview
