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
  </div>
</template>

<script>
import { ref, computed } from "vue";

const BUILDER_MOBILE_BREAKPOINT = 920;

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
    const displayedWidth = ref(null);
    const pixelRatio = window.devicePixelRatio;
    const handleOnLoad = ({ target }) => {
      currentSrc.value = target.currentSrc;
      naturalWidth.value = target.naturalWidth;
      displayedWidth.value = target.displayedWidth;
    };
    /** DEMO DATA END */

    const getCloudflareUrl = (url, options, toWebp = false) => {
      console.log({ url, options });
      return `${url}?w=${options?.width}`;
    };

    /**
     * 'sizes' attribute describes how much width image will take up after it's rendered.
     * (before even start to load an image)
     * We can provide media query to help the browser.
     */
    // TODO: make computed?..
    const sizes = [
      `(min-width: ${BUILDER_MOBILE_BREAKPOINT}px) ${props.width}px`,
      `calc(100vw - ${props.mobilePadding * 2}px)`,
    ].join(", ");

    const srcset = computed(() => {
      // Mobile device resolutions (can be added later on);
      const MOBILE_RESOLUTIONS = [360];
      // Mobile DPI levels
      const MOBILE_DPI_LEVELS = [1, 2, 2.625, 3]; // XXHDPI Density
      // Desktop resolutions (used only  to trim backgrounds);
      const DESKTOP_RESOLUTIONS = [1440, 1920];
      // Desktop DPI levels
      const DESKTOP_DPI_LEVELS = [1, 2];

      // If we know width and height, we can generate precice size for desktops:
      const desktopGridSrcset = DESKTOP_DPI_LEVELS.map((dpi) => {
        const width = props.width * dpi;
        const height = props.height * dpi;

        return `${getCloudflareUrl(props.url, { width, height })} ${width}w`;
      }).join(", ");

      // Pin mobile offset from sides - we'll need to subtract it
      const mobileOffset = props.mobilePadding * 2;
      // Loop through all defined mobile resolutions:
      const mobileGridSrcset = MOBILE_RESOLUTIONS.map((resolution) => {
        // Get CSS width of render area
        const cssWidth = resolution - mobileOffset;
        // Loop through all DIP levels and multiply css render area size by DPI
        return MOBILE_DPI_LEVELS.map((dpi) => {
          // Get image width at that resoluion
          const width = cssWidth * dpi;
          return `${getCloudflareUrl(props.url, { width })} ${width}w`;
        }).join(", ");
      }).join(", ");

      // For backgrounds - concat desktop clip resolutions (to prevent massive images)
      const desktopFullWidthSrcset = DESKTOP_RESOLUTIONS.map((resolution) => {
        return DESKTOP_DPI_LEVELS.map((dpi) => {
          const width = resolution * dpi;
          return `${getCloudflareUrl(props.url, { width })} ${width}w`;
        });
      }).join(", ");

      const mobileFullWidthSrcset = MOBILE_RESOLUTIONS.map((resolution) => {
        return MOBILE_DPI_LEVELS.map((dpi) => {
          const width = resolution * dpi;
          return `${getCloudflareUrl(props.url, { width })} ${width}w`;
        });
      }).join(", ");

      const gridSrcset = `${mobileGridSrcset}, ${desktopGridSrcset}`;
      const fullWidthSrcset = `${mobileFullWidthSrcset}, ${desktopFullWidthSrcset}`;

      return gridSrcset;
    });

    const src = computed(() => getCloudflareUrl(props.url)); // REPLACE WITH COMPOSABLE

    return {
      handleOnLoad,
      currentSrc,
      naturalWidth,
      displayedWidth,
      pixelRatio,
      sizes,
      src,
      srcset,
    };
  },
};
</script>
