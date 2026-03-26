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
type Page = 'front' | 'about' | 'post' | 'notfound'

const REMOTE_URL = 'https://playground.wordpress.net/remote.html'

// Paths are updated dynamically after content seeding
let pagePaths: Record<Page, string> = {
  front: '/',
  about: '/?page_id=10',
  post: '/?p=5',
  notfound: '/?p=99999',
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
      console.log('[Playground] Fetching theme ZIP...')
      const zipRes = await fetch(`/api/playground/${sessionId}`)
      if (!zipRes.ok) throw new Error(`Failed to fetch theme: ${zipRes.status}`)
      const zipBlob = await zipRes.blob()
      console.log('[Playground] ZIP fetched, size:', zipBlob.size, 'bytes')
      const zipFile = new File([zipBlob], `${themeSlug}.zip`, {
        type: 'application/zip',
      })

      console.log('[Playground] Loading WP Playground module...')
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

      console.log('[Playground] Starting WordPress...')
      const client = await startPlaygroundWeb({
        iframe: iframeRef.current,
        remoteUrl: REMOTE_URL,
      })
      console.log('[Playground] WordPress started. Document root:', await client.documentRoot)

      setCurrentStep('installing')
      console.log('[Playground] Installing theme:', themeSlug)
      await installTheme(client, { themeData: zipFile })
      console.log('[Playground] Theme installed')

      setCurrentStep('activating')
      console.log('[Playground] Activating theme:', themeSlug)
      await activateTheme(client, { themeFolderName: themeSlug })
      console.log('[Playground] Theme activated')

      // Verify active theme and list installed theme files
      const docRoot = await client.documentRoot
      const phpPrefix = `<?php include '${docRoot}/wp-load.php'; `

      const verifyResult = await client.run({
        code: phpPrefix + `
$theme = wp_get_theme();
echo "Active theme stylesheet: " . $theme->get_stylesheet() . "\\n";
echo "Active theme template: " . $theme->get_template() . "\\n";
echo "Theme root: " . $theme->get_theme_root() . "/" . $theme->get_stylesheet() . "\\n";
$theme_dir = $theme->get_theme_root() . "/" . $theme->get_stylesheet();
if (is_dir($theme_dir)) {
  $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($theme_dir, RecursiveDirectoryIterator::SKIP_DOTS));
  echo "Theme files:\\n";
  foreach ($files as $file) {
    echo "  " . str_replace($theme_dir . "/", "", $file->getPathname()) . " (" . $file->getSize() . " bytes)\\n";
  }
} else {
  echo "ERROR: Theme directory does not exist: " . $theme_dir . "\\n";
}

// Check theme.json content
$theme_json_path = $theme_dir . "/theme.json";
if (file_exists($theme_json_path)) {
  $tj = json_decode(file_get_contents($theme_json_path), true);
  echo "\\ntheme.json version: " . ($tj["version"] ?? "missing") . "\\n";
  echo "theme.json has styles: " . (isset($tj["styles"]) ? "YES" : "NO") . "\\n";
  if (isset($tj["styles"]["color"])) {
    echo "styles.color.background: " . $tj["styles"]["color"]["background"] . "\\n";
    echo "styles.color.text: " . $tj["styles"]["color"]["text"] . "\\n";
  }
  echo "palette count: " . count($tj["settings"]["color"]["palette"] ?? []) . "\\n";
} else {
  echo "ERROR: theme.json not found\\n";
}

// Check templates
$templates_dir = $theme_dir . "/templates";
if (is_dir($templates_dir)) {
  echo "\\nTemplates found:\\n";
  foreach (glob($templates_dir . "/*.html") as $tpl) {
    $content = file_get_contents($tpl);
    $basename = basename($tpl);
    echo "  " . $basename . " (" . strlen($content) . " chars)\\n";
    // Show first 200 chars of each template
    echo "    preview: " . substr(str_replace("\\n", " ", $content), 0, 200) . "\\n";
  }
} else {
  echo "ERROR: templates directory not found\\n";
}
`,
      })
      console.log('[Playground] Theme verification:\\n' + verifyResult.text)

      // Seed sample content
      console.log('[Playground] Seeding site options...')
      const siteName = themeSlug.replace(/'/g, "\\'").split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      const optResult = await client.run({
        code: phpPrefix + `update_option('blogname', ''); update_option('blogdescription', ''); echo 'ok';`,
      })
      console.log('[Playground] Site options result:', optResult.text)

      // Delete default WP content that interferes with theme preview, then set up latest posts
      console.log('[Playground] Deleting defaults + setting up latest posts + creating sample posts...')
      const postsResult = await client.run({
        code: phpPrefix + `
// Delete default WordPress content
wp_delete_post(1, true); // Delete "Hello world!" post
wp_delete_post(2, true); // Delete "Sample Page"

// Use latest posts as front page so index.html template renders with query loop
update_option('show_on_front', 'posts');
delete_option('page_on_front');
update_option('permalink_structure', '/%postname%/');
flush_rewrite_rules();

// Helper to create a placeholder image and attach as featured image
function create_placeholder_image($post_id, $color, $label) {
  $upload_dir = wp_upload_dir();
  $width = 1200;
  $height = 800;
  $img = imagecreatetruecolor($width, $height);

  // Parse hex color
  $r = hexdec(substr($color, 1, 2));
  $g = hexdec(substr($color, 3, 2));
  $b = hexdec(substr($color, 5, 2));
  $bg_color = imagecolorallocate($img, $r, $g, $b);
  imagefill($img, 0, 0, $bg_color);

  // Add a subtle lighter rectangle for visual interest
  $lighter = imagecolorallocate($img, min(255, $r + 30), min(255, $g + 30), min(255, $b + 30));
  imagefilledrectangle($img, 80, 80, $width - 80, $height - 80, $lighter);

  // Add text label
  $text_color = imagecolorallocate($img, min(255, $r + 100), min(255, $g + 100), min(255, $b + 100));
  imagestring($img, 5, $width / 2 - strlen($label) * 4.5, $height / 2 - 8, $label, $text_color);

  $filename = 'placeholder-' . $post_id . '.jpg';
  $filepath = $upload_dir['path'] . '/' . $filename;
  imagejpeg($img, $filepath, 85);
  imagedestroy($img);

  $filetype = wp_check_filetype($filename);
  $attachment_id = wp_insert_attachment(array(
    'post_mime_type' => $filetype['type'],
    'post_title'     => $label,
    'post_content'   => '',
    'post_status'    => 'inherit'
  ), $filepath, $post_id);

  require_once(ABSPATH . 'wp-admin/includes/image.php');
  $attach_data = wp_generate_attachment_metadata($attachment_id, $filepath);
  wp_update_attachment_metadata($attachment_id, $attach_data);
  set_post_thumbnail($post_id, $attachment_id);
}

// Create sample posts with featured images
// Use muted tones that work with any theme palette
$colors = array('#3d4f5f', '#4a5568', '#2d3748');

$p1 = wp_insert_post(array('post_title' => 'Getting Started with Your Theme', 'post_content' => '<!-- wp:paragraph --><p>This post demonstrates how your blog content looks with your chosen typography and colors. The layout you see is powered by the index.html template and its query loop block.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Try switching between the Desktop, Tablet, and Mobile viewport buttons above to see how the theme responds to different screen sizes.</p><!-- /wp:paragraph -->', 'post_status' => 'publish'));
create_placeholder_image($p1, $colors[0], 'Featured Image');

$p2 = wp_insert_post(array('post_title' => 'Exploring Block Patterns', 'post_content' => '<!-- wp:paragraph --><p>Block patterns are pre-designed layouts you can insert into any page or post. Your theme includes several custom patterns that match the design system.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Patterns save time by providing ready-made sections like hero areas, call-to-action blocks, and content grids.</p><!-- /wp:paragraph -->', 'post_status' => 'publish'));
create_placeholder_image($p2, $colors[1], 'Featured Image');

$p3 = wp_insert_post(array('post_title' => 'Customizing Your Design', 'post_content' => '<!-- wp:paragraph --><p>Use the WordPress Site Editor to customize colors, typography, and layouts. Everything is defined in theme.json and can be adjusted without writing code.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Your theme includes style variations for dark mode and high contrast that you can switch between in the Site Editor.</p><!-- /wp:paragraph -->', 'post_status' => 'publish'));
create_placeholder_image($p3, $colors[2], 'Featured Image');

// Create About page
$about_id = wp_insert_post(array(
  'post_title' => 'About',
  'post_type' => 'page',
  'post_content' => '<!-- wp:heading {"level":2} --><h2>Our Story</h2><!-- /wp:heading --><!-- wp:paragraph --><p>We started with a simple idea: create something meaningful. What began as a passion project has grown into something we are truly proud of. Every decision we make is guided by our commitment to quality and authenticity.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Our team brings together diverse perspectives and deep expertise. We believe the best work comes from collaboration, curiosity, and a willingness to challenge conventions.</p><!-- /wp:paragraph --><!-- wp:heading {"level":2} --><h2>What We Do</h2><!-- /wp:heading --><!-- wp:paragraph --><p>We craft thoughtful experiences that connect with people. From concept to execution, we pay attention to every detail because we know it matters.</p><!-- /wp:paragraph -->',
  'post_status' => 'publish',
));
create_placeholder_image($about_id, '#5a4a8a', 'About Page');

echo json_encode(array('post_id' => $p1, 'about_id' => $about_id));
`,
      })
      console.log('[Playground] Posts/settings result:', postsResult.text)

      // Parse post IDs from PHP output and set dynamic page paths
      try {
        const ids = JSON.parse(postsResult.text) as { post_id: number; about_id: number }
        pagePaths = {
          front: '/',
          about: `/?page_id=${ids.about_id}`,
          post: `/?p=${ids.post_id}`,
          notfound: '/?p=99999',
        }
        console.log('[Playground] Dynamic page paths:', pagePaths)
      } catch {
        console.log('[Playground] Could not parse post IDs, using defaults')
      }

      // Inject placeholder images into theme templates (cover blocks, wp:image blocks)
      console.log('[Playground] Injecting placeholder images into theme templates...')
      const imgInjectCode = [
        phpPrefix,
        '// Create standalone placeholder images for theme templates',
        'function create_standalone_image($color, $label, $w = 1600, $h = 900) {',
        '  $ud = wp_upload_dir();',
        '  $im = imagecreatetruecolor($w, $h);',
        '  $r = hexdec(substr($color,1,2)); $g = hexdec(substr($color,3,2)); $b = hexdec(substr($color,5,2));',
        '  $c = imagecolorallocate($im, $r, $g, $b); imagefill($im, 0, 0, $c);',
        '  for ($y=0; $y<$h; $y++) {',
        '    $a = (int)($y/$h*40);',
        '    $ov = imagecolorallocate($im, max(0,$r-$a), max(0,$g-$a), max(0,$b-$a));',
        '    imageline($im, 0, $y, $w, $y, $ov);',
        '  }',
        '  $l = imagecolorallocate($im, min(255,$r+25), min(255,$g+25), min(255,$b+25));',
        '  imagefilledrectangle($im, (int)($w*0.05), (int)($h*0.1), (int)($w*0.95), (int)($h*0.9), $l);',
        '  $ac = imagecolorallocate($im, min(255,$r+50), min(255,$g+50), min(255,$b+50));',
        '  imagefilledrectangle($im, (int)($w*0.1), (int)($h*0.15), (int)($w*0.9), (int)($h*0.85), $ac);',
        '  $fn = "theme-" . sanitize_title($label) . ".jpg";',
        '  $fp = $ud["path"] . "/" . $fn;',
        '  imagejpeg($im, $fp, 90); imagedestroy($im);',
        '  $ft = wp_check_filetype($fn);',
        '  $aid = wp_insert_attachment(array("post_mime_type"=>$ft["type"],"post_title"=>$label,"post_content"=>"","post_status"=>"inherit"), $fp, 0);',
        '  require_once(ABSPATH . "wp-admin/includes/image.php");',
        '  wp_update_attachment_metadata($aid, wp_generate_attachment_metadata($aid, $fp));',
        '  return array("id"=>$aid, "url"=>wp_get_attachment_url($aid));',
        '}',
        '',
        '$hero_img  = create_standalone_image("#2d3748", "Hero Background", 1920, 1080);',
        '$about_img = create_standalone_image("#4a5568", "About Section", 1200, 800);',
        '$split_img = create_standalone_image("#5a4a8a", "Split Hero", 800, 1000);',
        '',
        '// Inject images into theme template and pattern files',
        '$theme = wp_get_theme();',
        '$td = $theme->get_theme_root() . "/" . $theme->get_stylesheet();',
        '$updated = array();',
        '',
        'foreach (array("templates","parts","patterns") as $sub) {',
        '  $d = $td . "/" . $sub;',
        '  if (!is_dir($d)) continue;',
        '  foreach (glob($d . "/*") as $f) {',
        '    $ct = file_get_contents($f);',
        '    $orig = $ct;',
        '',
        '    // Inject hero image into wp:cover blocks with overlayColor but no url',
        '    $marker = "<!-- wp:cover ";',
        '    $p = 0;',
        '    while (($p = strpos($ct, $marker, $p)) !== false) {',
        '      $js = $p + strlen($marker);',
        '      $je = strpos($ct, " -->", $js);',
        '      if ($je === false) break;',
        '      $json = substr($ct, $js, $je - $js);',
        '      $at = json_decode($json, true);',
        '      if ($at && isset($at["overlayColor"]) && !isset($at["url"])) {',
        '        $at["url"] = $hero_img["url"];',
        '        $at["id"] = $hero_img["id"];',
        '        $at["hasParallax"] = false;',
        '        $nj = json_encode($at, JSON_UNESCAPED_SLASHES);',
        '        $ct = substr($ct, 0, $js) . $nj . substr($ct, $je);',
        '      }',
        '      $p = $js + 1;',
        '    }',
        '',
        '    // Inject images into empty wp:image blocks',
        '    $imgs = array($split_img, $about_img);',
        '    $ii = 0;',
        '    $marker2 = "<!-- wp:image";',
        '    $p = 0;',
        '    while (($p = strpos($ct, $marker2, $p)) !== false) {',
        '      $use = $imgs[min($ii, count($imgs)-1)];',
        '      $ii++;',
        '      // Find the img tag after this block comment',
        '      $img_pos = strpos($ct, "<img", $p);',
        '      $fig_end = strpos($ct, "/>", $img_pos);',
        '      if ($img_pos === false || $fig_end === false || $img_pos - $p > 500) { $p++; continue; }',
        '      // Check if img already has a real src',
        '      $img_tag = substr($ct, $img_pos, $fig_end - $img_pos + 2);',
        '      if (strpos($img_tag, "http") !== false) { $p = $fig_end; continue; }',
        '      $new_tag = \'<img src="\' . $use["url"] . \'" alt="" class="wp-image-\' . $use["id"] . \'"/>\';',
        '      $ct = substr($ct, 0, $img_pos) . $new_tag . substr($ct, $fig_end + 2);',
        '      $p = $img_pos + strlen($new_tag);',
        '    }',
        '',
        '    if ($ct !== $orig) {',
        '      file_put_contents($f, $ct);',
        '      $updated[] = basename($f);',
        '    }',
        '  }',
        '}',
        '',
        'echo json_encode(array("hero"=>$hero_img,"about"=>$about_img,"split"=>$split_img,"files_updated"=>$updated));',
      ].join('\n')
      const imgResult = await client.run({ code: imgInjectCode })
      console.log('[Playground] Image injection result:', imgResult.text)

      console.log('[Playground] Navigating to / ...')
      await client.goTo('/')
      console.log('[Playground] Navigation complete. Fetching rendered HTML...')

      // Fetch the rendered front page HTML to check what's actually showing
      const pageResult = await client.run({
        code: phpPrefix + `
$url = home_url('/');
echo "Home URL: " . $url . "\\n";
echo "show_on_front: " . get_option('show_on_front') . "\\n";
echo "page_on_front: " . get_option('page_on_front') . "\\n";
$front_id = get_option('page_on_front');
if ($front_id) {
  $post = get_post($front_id);
  echo "Front page title: " . ($post ? $post->post_title : 'NOT FOUND') . "\\n";
  echo "Front page status: " . ($post ? $post->post_status : 'N/A') . "\\n";
  echo "Front page content length: " . ($post ? strlen($post->post_content) : 0) . " chars\\n";
  echo "Front page content preview: " . ($post ? substr($post->post_content, 0, 300) : 'N/A') . "\\n";
}
`,
      })
      console.log('[Playground] Page state:\\n' + pageResult.text)

      clientRef.current = client
      setActivePage('front')
      setCurrentUrl('/')
      setStatus('active')
      console.log('[Playground] === BOOT COMPLETE, status set to active ===')
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
                    { key: 'about', label: 'About' },
                    { key: 'post', label: 'Blog Post' },
                    { key: 'notfound', label: '404' },
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
