<template>
  <div>
    <img
      :alt="'alt'"
      :sizes="sizes"
      :src="src"
      :srcset="srcset"
      @load="handleOnLoad($event)"
    /><br />
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

// If we know width and height, we can generate precice size for desktops:

export const getFileNameWithExtension = (src) => {
  const [fileName, fileExtension] = src
    .split("?")[0] // remove query string, if any
    .split("/")
    .slice(-1)[0] // get the last part of the path
    .split(".");

  return `${fileName}.${fileExtension}`;
};

export const getMimeType = (fileNameWithExtension) =>
  fileNameWithExtension
    .split(".")
    .slice(-1)[0]
    .toLowerCase() // MIME type is lowercase
    .replace("jpg", "jpeg") // fix errorneous jpg type
    .replace("", "image/"); // prepend `image/` to the type

export const getCloudflareSrc = (origin, src, options, toWebp) => {
  console.log("OPTIMIZE FOR CLOUDFLARE");

  const optionString = [
    options.width && `width=${options.width}`,
    // options.height && `height=${options.height}`,
    options.fit && `fit=${options.fit}`,
    options.isLossless && "quality=100", // override default lossy 85
  ]
    .filter((param) => !!param)
    .join(",");

  // return `${origin}/${CLOUDFLARE_PREFIX}/${optionString}/${src}`;
  return `alioalio`;
};

export const getUnsplashSrc = (src, options, toWebp) => {
  const optionString = [
    options.width && `width=${options.width}`,
    options.height && `height=${options.height}`,
    options.fit && `fit=${options.fit}`,
    options.isLossless && "quality=100", // override default lossy 85
  ]
    .filter((param) => !!param)
    .join("&");

  // return `${origin}/${CLOUDFLARE_PREFIX}/${optionString}/${src}`;
  // return `${src}?w=${options?.width}`;
  return `${src}?${optionString}`;
  // return src;
};

export const getOptimizedSrc = (src, options, toWebp = false) => {
  const [cloudflareOrigin] = CLOUDFLARE_ORIGINS.filter((o) => src.includes(o));
  if (cloudflareOrigin) {
    return getCloudflareSrc(cloudflareOrigin, src, options, toWebp);
  }

  if (src.includes(UNSPLASH_ORIGIN)) {
    return getUnsplashSrc(src, options, toWebp);
  }

  return src;
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

    /**
     * 'sizes' attribute describes how much width image will take up after it's rendered.
     * (before even start to load an image)
     * We can provide media query to help the browser.
     */
    // TODO: make computed?..
    // TODO: test if using CSS variable '--m-block-padding' would work
    const gridSizes = [
      `(min-width: ${BUILDER_MOBILE_BREAKPOINT}px) ${props.width}px`,
      `calc(100vw - ${props.mobilePadding * 2}px)`,
    ].join(", ");

    const srcset = computed(() => {
      const desktopGridSrcset = DESKTOP_DPI_LEVELS.map((dpi) => {
        const width = Math.round(props.width * dpi);
        const height = Math.round(props.height * dpi);

        return `${getOptimizedSrc(props.url, { width, height })} ${width}w`;
      }).join(", ");

      // Pin mobile offset from sides - we'll need to subtract it
      const mobileOffset = props.mobilePadding * 2;
      // Loop through all defined mobile resolutions:
      const mobileGridSrcset = MOBILE_RESOLUTIONS.map((resolution) => {
        // Get CSS width of render area
        const cssWidth = resolution - mobileOffset;
        // Loop through all DIP levels and multiply css render area size by DPI
        return MOBILE_DPI_LEVELS.map((dpi) => {
          // Get ratio from props
          const ratio = props.width / props.height;
          // Get image width at that resolution
          const width = Math.round(cssWidth * dpi);
          // Calculate height at current width (something's not right here)
          const height = Math.round(width / ratio);

          return `${getOptimizedSrc(props.url, { width, height })} ${width}w`;
        }).join(", ");
      }).join(", ");

      // For backgrounds - concat desktop clip resolutions (to prevent massive images)
      const desktopFullWidthSrcset = DESKTOP_RESOLUTIONS.map((resolution) => {
        return DESKTOP_DPI_LEVELS.map((dpi) => {
          const width = Math.round(resolution * dpi);

          return `${getOptimizedSrc(props.url, { width })} ${width}w`;
        });
      }).join(", ");

      const mobileFullWidthSrcset = MOBILE_RESOLUTIONS.map((resolution) => {
        return MOBILE_DPI_LEVELS.map((dpi) => {
          const width = Math.round(resolution * dpi);

          return `${getOptimizedSrc(props.url, { width })} ${width}w`;
        });
      }).join(", ");

      const gridSrcset = `${mobileGridSrcset}, ${desktopGridSrcset}`;
      const fullWidthSrcset = `${mobileFullWidthSrcset}, ${desktopFullWidthSrcset}`;

      return gridSrcset;
    });

    const src = computed(() => getOptimizedSrc(props.url)); // REPLACE WITH COMPOSABLE

    return {
      handleOnLoad,
      currentSrc,
      naturalWidth,
      pixelRatio,
      sizes: gridSizes,
      src: props.url,
      srcset,
    };
  },
};
</script>
