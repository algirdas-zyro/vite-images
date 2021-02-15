<template>
  <div>
    <img
      :alt="'alt'"
      :sizes="sizes"
      :src="src"
      :srcset="srcset"
      @load="handleOnLoad($event)"
    />
    {{ currentSrc }}
    {{ naturalWidth }}
  </div>
</template>

<script>
import { ref, computed } from "vue";

const BUILDER_MOBILE_BREAKPOINT = 920;

// https://analytics.google.com/analytics/web/#/report/visitors-browser/a26575989w211686538p203207761/_u.date00=20201201&_u.date01=20210212&explorer-segmentExplorer.segmentId=analytics.screenResolution&explorer-table.plotKeys=%5B%5D/
const WIDTH_BREAKPOINTS = [
  320, // 16.8% lighthouse mobile default
  360, // 16.8% lighthouse mobile default
  375, // 6.2%
  412, // 6% (+ 414 5.2%) = 11.2%
  920, // our default ¯\_(ツ)_/¯
  1366, // 19%
  1440, // 4.1%
  1920, // 12.6%
];

const SIZES = [
  "666px", // explicit width
  "calc(100vw - 32px)", // mobile full-width image
];

const DPI_LEVELS = [1, 2, 3];

const SRC = "https://ik.imagekit.io/ghykvifc0ny/DSC05804_IXuabbBeW.JPG";

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
      type: String,
      default: "32px", // --m-block-padding -- you usually won't override this
    },
  },
  setup(props) {
    const currentSrc = ref(null);
    const naturalWidth = ref(null);

    const handleOnLoad = ({ target }) => {
      currentSrc.value = target.currentSrc;
      naturalWidth.value = target.naturalWidth;
    };

    const getCloudflareUrl = (url, options, toWebp = false) => {
      return `${url}?w=${options?.width}`;
    };

    const sizes = computed(
      () =>
        `(min-width: ${BUILDER_MOBILE_BREAKPOINT}px) ${props.width}px, calc(100vw - ${props.mobilePadding})`
    );

    const srcset = computed(() => {
      // ADD DPI LEVELS HERE
      return WIDTH_BREAKPOINTS.filter((width) => width < props.width)
        .reduce((acc, curr) => [...acc, curr, curr * 2, curr * 3, curr * 4], [
          +props.width,
          +props.width * 2,
          +props.width * 3,
          +props.width * 4,
        ])
        .sort((a, b) => a - b)
        .map((width) => `${getCloudflareUrl(props.url, { width })} ${width}w`)
        .join(", ");
      console.log({ widths });
    });

    const src = computed(() => getCloudflareUrl(props.url)); // REPLACE WITH COMPOSABLE

    return {
      handleOnLoad,
      currentSrc,
      naturalWidth,
      sizes,
      src,
      srcset,
    };
  },
};
</script>
