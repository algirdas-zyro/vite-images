<template>
  <div class="wrapper" :style="{ width: `${width}px`, height: `${height}px` }">
    <img
      :alt="'alt'"
      :sizes="sizes"
      :src="src"
      :srcset="srcset"
      @load="handleOnLoad($event)"
    /><br />
  </div>
  <div>
    currentSrc: <br />{{ currentSrc }} <br />
    naturalWidth <br />{{ naturalWidth }}<br />
    pixelRatio: <br />{{ pixelRatio }}<br />
    props: <br />{{ width }} x {{ height }}<br />
  </div>
</template>

<script>
import { ref, computed } from "vue";

// Supported Cloudflare origins
export const CLOUDFLARE_ORIGINS = [
  "https://assets.zyrosite.space", // staging?
  "https://assets.zyrosite.com", // production
  "https://assets2.zyrosite.com", // temporary production
];

// Unsplash origin
export const UNSPLASH_ORIGIN = "https://images.unsplash.com";

// Cloudflare image opzimization prefix for supported origins:
// https://developers.cloudflare.com/images/url-format
export const CLOUDFLARE_PREFIX = "cdn-cgi/image";

export const BUILDER_MOBILE_BREAKPOINT = 920;

// Mobile device resolutions (can be added later on);
export const MOBILE_RESOLUTIONS = [360];
// Mobile DPI levels
export const MOBILE_DPI_LEVELS = [1, 2, 2.625, 3]; // 2.625 is XXHDPI Density used in PageSpeed device
// Desktop resolutions (used only  to trim backgrounds);
export const DESKTOP_RESOLUTIONS = [1440, 1920];
// Desktop DPI levels
export const DESKTOP_DPI_LEVELS = [1, 2];

/**
 * Web URL API is not used as it needs core-js runtime polyfill
 * Read more: (https://github.com/zloirock/core-js/issues/117)
 */

export const getCloudflareSrc = (origin, src, options) => {
  /**
   * Cloudflare service options: https://developers.cloudflare.com/images/url-format#options
   * 'format=auto' - picks best supported format (usually webp) via user-agent
   * 'fit=scale-down' - same as `object-fit: contain` except it doesn't enlarge
   * 'fit=crop' - same as `object-fit: cover` except it doesn't enlarge (default)
   */

  const optionString = [
    "format=auto",
    options.width && `w=${options.width}`,
    options.height && `h=${options.height}`,
    options.shouldContain ? "fit=scale-down" : "fit=crop",
    options.isLossless && "q=100", // override default lossy 85
  ]
    .filter((param) => !!param)
    .join(",");

  const [, path] = src.split(origin);

  return `${origin}/${CLOUDFLARE_PREFIX}/${optionString}/${path}`;
};

export const getUnsplashSrc = (src, options) => {
  /**
   * Unsplash service options: https://docs.imgix.com/apis/rendering
   * 'auto=format' - picks best supported format (usually webp) via user-agent
   * 'fit=clip' - same as `object-fit: contain` except it doesn't enlarge
   * 'fit=crop' - same as `object-fit: cover` except it doesn't enlarge (default)
   */

  const optionString = [
    "auto=format",
    options.width && `w=${options.width}`,
    options.height && `h=${options.height}`,
    options.shouldContain ? "fit=clip" : "fit=crop",
    options.isLossless && "q=100", // override default lossy 75
  ]
    .filter((param) => !!param)
    .join("&");

  return `${src}?${optionString}`;
};

export const getOptimizedSrc = (src, options = {}) => {
  const [cloudflareOrigin] = CLOUDFLARE_ORIGINS.filter((o) => src.includes(o));
  if (cloudflareOrigin) {
    return getCloudflareSrc(cloudflareOrigin, src, options);
  }

  if (src.includes(UNSPLASH_ORIGIN)) {
    return getUnsplashSrc(src, options);
  }

  return src;
};

export const getGridItemSrcet = (
  url,
  gridItemWidth,
  gridItemHeigt,
  mobilePadding
) => {
  const desktopGridSrcset = DESKTOP_DPI_LEVELS.map((dpi) => {
    const width = Math.round(gridItemWidth * dpi);
    const height = Math.round(gridItemHeigt * dpi);

    return `${getOptimizedSrc(url, { width, height })} ${width}w`;
  }).join(", ");

  // Pin mobile offset from sides - we'll need to subtract it
  const mobileOffset = mobilePadding * 2;
  // Loop through all defined mobile resolutions:
  const mobileGridSrcset = MOBILE_RESOLUTIONS.map((resolution) => {
    // Get CSS width of render area
    const cssWidth = resolution - mobileOffset;
    // Loop through all DIP levels and multiply css render area size by DPI
    return MOBILE_DPI_LEVELS.map((dpi) => {
      // Get ratio from props
      const ratio = gridItemWidth / gridItemHeigt;
      // Get image width at that resolution
      const width = Math.round(cssWidth * dpi);
      // Calculate height at current width (something's not right here)
      const height = Math.round(width / ratio);

      return `${getOptimizedSrc(url, { width, height })} ${width}w`;
    }).join(", ");
  }).join(", ");

  return `${mobileGridSrcset}, ${desktopGridSrcset}`;
};

// For backgrounds - concat desktop clip resolutions (to prevent massive images)
export const getFullWidthSrcset = (url) => {
  const desktopFullWidthSrcset = DESKTOP_RESOLUTIONS.map((resolution) => {
    return DESKTOP_DPI_LEVELS.map((dpi) => {
      const width = Math.round(resolution * dpi);

      return `${getOptimizedSrc(url, { width })} ${width}w`;
    });
  }).join(", ");

  const mobileFullWidthSrcset = MOBILE_RESOLUTIONS.map((resolution) => {
    return MOBILE_DPI_LEVELS.map((dpi) => {
      const width = Math.round(resolution * dpi);

      return `${getOptimizedSrc(url, { width })} ${width}w`;
    });
  }).join(", ");

  return `${mobileFullWidthSrcset}, ${desktopFullWidthSrcset}`;
};

export const useSrcset = (props) => {
  /**
   * 'sizes' attribute describes how much width image will take up after it's rendered.
   * (before even start to load an image)
   * We can provide media query to help the browser.
   */
  const gridItemSizes = computed(() =>
    [
      `(min-width: ${BUILDER_MOBILE_BREAKPOINT}px) ${props.width}px`,
      `calc(100vw - ${props.mobilePadding * 2}px)`,
    ].join(", ")
  );

  // No need for computed here, however let's keep data structure consistant
  const fullScreenSizes = computed(() => "100vw");

  const srcset = computed(() => {
    const gridSrcset = getGridItemSrcet(
      props.url,
      props.width,
      props.height,
      props.mobilePadding
    );
    const fullWidthSrcset = getFullWidthSrcset(props.url);

    return gridSrcset;
  });

  const src = computed(() =>
    getOptimizedSrc(props.url, {
      width: props.width,
      height: props.height,
    })
  );

  return {
    sizes: gridItemSizes,
    src,
    srcset,
  };
};

export default {
  props: {
    url: {
      type: String,
      required: true,
    },
    width: {
      type: Number,
      default: null,
    },
    height: {
      type: Number,
      default: null,
    },
    isFullWidth: {
      type: Number,
      default: null,
    },
    mobilePadding: {
      type: Number,
      default: 16, // --m-block-padding -- you usually won't override this
    },
  },
  setup(props) {
    /** DEMO DATA START */
    const currentSrc = ref(null);
    const naturalWidth = ref(null);
    const pixelRatio = window.devicePixelRatio;
    const handleOnLoad = ({ target }) => {
      currentSrc.value = target.currentSrc;
      naturalWidth.value = target.naturalWidth;
    };
    /** DEMO DATA END */

    const { sizes, src, srcset } = useSrcset(props);

    return {
      handleOnLoad,
      currentSrc,
      naturalWidth,
      pixelRatio,
      sizes,
      src,
      srcset,
    };
  },
};
</script>

<style>
.wrapper {
  position: relative;
}

img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>