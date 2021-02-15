<template>
    <img :src="src" />
</template>

<script>
import { computed } from "vue";

/**
 * Technically, builder only has 920. the descending  order is important
 */
const SIZE_BREAKPOINT = 920;

const DPI_LEVELS = [1, 2, 3];

const WIDTH = 500;
const HEIGHT = 300;
const SRC = "https://ik.imagekit.io/ghykvifc0ny/DSC05804_IXuabbBeW.JPG";

const usePicture = (props) => {
  // http://url.com/IMAGE.JPG?query=param => IMAGE.jpeg
  const srcFileName = computed(() => {
    const [fileName, fileExtension] = props.src
      .split("?")[0] // remove query string, if any
      .split("/")
      .slice(-1)[0] // get the last part of the path
      .split(".");

    return `${fileName}.${fileExtension}`;
  });

  const mimeType = computed(() => {
    return srcFileName.value
      .split(".")
      .slice(-1)[0]
      .toLowerCase() // MIME type is lowercase
      .replace("jpg", "jpeg") // fix errorneous jpg type
      .replace("", "image/"); // prepend `image/` to the type
  });

  const src = computed(
    () => `${props.src}?tr=w-${props.width},h-${props.height} ${props.width}w`
  );

  const getSrcset = ({ toWebp = false } = {}) => {
    return DPI_LEVELS.map((dpi) => {
      const w = props.width && props.width * dpi;
      const h = props.height && props.height * dpi;
      const transformParams = [`w-${w}`];

      // Only resize height if it was provided implicitly (for desktops).
      if (props.height) transformParams.push(`h-${h}`);
      // Only convert to webp if `toWebp` was passed.
      if (toWebp) transformParams.push("f-webp");

      return `${props.src}?tr=${transformParams.join(",")} ${w}w`;
    }).join(", ");
  };

  const sources = computed(() => {
    const webpSrc = computed(() => {
      const originalExtension = srcFileName.value.split(".").slice(-1)[0];
      return props.src.replace(originalExtension, "webp");
    });

    // ORDER IS IMPORTANT - it acts as early return;
    // First valid condition is implmented and others are ignored
    return [
      {
        media: `(min-width: ${SIZE_BREAKPOINT}px)`,
        sizes: `${props.width}px`,
        srcset: getSrcset({ toWebp: true }),
        type: "image/webp",
      },
      {
        media: `(min-width: ${SIZE_BREAKPOINT}px)`,
        sizes: `${props.width}px`,
        srcset: getSrcset(),
        type: mimeType.value,
      },
      {
        sizes: "calc(100vw - var(--m-block-padding) - var(--m-block-padding))",
        srcset: getSrcset({ toWebp: true }),
        type: "image/webp",
      },
      {
        sizes: "calc(100vw - var(--m-block-padding) - var(--m-block-padding))",
        srcset: getSrcset(),
        type: mimeType.value,
      },
    ];
  });

  return {
    src,
    sources,
  };
};

export default {
  setup() {
    // hardcoded props. fallback for full-screens
    const props = {
      width: WIDTH || window.innerWidth,
      height: HEIGHT || window.innerHeight,
      src: SRC,
    };

    const { src, sources } = usePicture(props);

    return {
      sources,
      src,
    };
  },
};
</script>
