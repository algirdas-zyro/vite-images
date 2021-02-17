// Cloudflare image opzimization prefix for supported origins: https://developers.cloudflare.com/images/url-format
export const CLOUDFLARE_PREFIX = 'cdn-cgi/image';

// Supported Cloudflare origins
export const CLOUDFLARE_ORIGINS = [
	'https://assets.zyrosite.space', // staging?
	'https://assets.zyrosite.com', // production
	'https://assets2.zyrosite.com', // temporary production
];

export const UNSPLASH_ORIGIN = 'https://images.unsplash.com';

export const SIZES_MAP = {
	'(all)': 'calc(100vw - var(--m-block-padding) - var(--m-block-padding))',
	'(max-width: 920px)': 'calc(100vw - var(--m-block-padding) - var(--m-block-padding))',
	// 414: 'calc(100vw - var(--m-block-padding) - var(--m-block-padding))',
	// 360: 'calc(100vw - var(--m-block-padding) - var(--m-block-padding))',
	// 320: 'calc(100vw - var(--m-block-padding) - var(--m-block-padding))',
};

export const MAX_WIDTH = 1920;
export const MAX_HEIGHT = 1080;

export const SIZE_BREAKPOINT = 920;
export const DPI_LEVELS = [1, 2, 3];

export const getFileNameWithExtension = (src) => {
	const [fileName, fileExtension] = src
		.split('?')[0] // remove query string, if any
		.split('/')
		.slice(-1)[0] // get the last part of the path
		.split('.');

	return `${fileName}.${fileExtension}`;
};

export const getMimeType = (fileNameWithExtension) => fileNameWithExtension
	.split('.')
	.slice(-1)[0]
	.toLowerCase() // MIME type is lowercase
	.replace('jpg', 'jpeg') // fix errorneous jpg type
	.replace('', 'image/'); // prepend `image/` to the type

export const getUnsplashSources = (src) => {
	console.log(src);
	return src;
};

export const getCloudflareSrc = (filePath, origin, options = {}, toWebp = false) => {
	// TODO: investigate cloudflare fit options
	console.log({ toWebp });

	const fileNameWithExtension = getFileNameWithExtension(filePath);
	const mimeType = getMimeType(fileNameWithExtension);
	console.log(mimeType);

	const optionString = [
		options.width && `width=${options.width}`,
		options.height && `height=${options.height}`,
		options.fit && `fit=${options.fit}`,
		options.isLossless && 'quality=100', // override default lossy 85
	].filter((param) => !!param).join(',');

	return `${origin}/${CLOUDFLARE_PREFIX}/${optionString}/${filePath}`;
};

export const getCloudflareSourceSrcset = (filePath, origin, options = {}, toWebp = false) => {
	// TODO: investigate cloudflare fit options
	console.log({ toWebp });

	const fileNameWithExtension = getFileNameWithExtension(filePath);
	const mimeType = getMimeType(fileNameWithExtension);
	console.log(mimeType);

	const optionString = [
		options.width && `width=${options.width}`,
		options.height && `height=${options.height}`,
		options.fit && `fit=${options.fit}`,
		options.isLossless && 'quality=100', // override default lossy 85
	].filter((param) => !!param).join(',');

	return `${origin}/${CLOUDFLARE_PREFIX}/${optionString}/${filePath}`;
};

export const getCloudflareSources = (filePath, origin, options) => {
	// this should return 'sizes' (array vw + actual size) and 'srcset' (array of src + w)

	// loop through breakpoints + ratios + formats (webp)
	const fileNameWithExtension = getFileNameWithExtension(filePath);
	const mimeType = getMimeType(fileNameWithExtension);
	const optionString = [
		options.width && `width=${options.width}`,
		options.height && `height=${options.height}`,
		options.fit && `fit=${options.fit}`,
		options.isLossless && 'quality=100', // override default lossy 85
	].filter((param) => !!param).join(',');

	// Technically, builder only has 920. the descending  order is important
	return [
		{
			media: `(min-width: ${SIZE_BREAKPOINT}px)`,
			sizes: `${options.width}px`,
			srcset: getSrcset({ toWebp: true }),
			type: 'image/webp',
		},
		{
			media: `(min-width: ${SIZE_BREAKPOINT}px)`,
			sizes: `${options.width}px`,
			srcset: getSrcset(),
			type: mimeType,
		},
		{
			sizes: 'calc(100vw - var(--m-block-padding) - var(--m-block-padding))',
			srcset: getSrcset({ toWebp: true }),
			type: 'image/webp',
		},
		{
			sizes: 'calc(100vw - var(--m-block-padding) - var(--m-block-padding))',
			srcset: getSrcset(),
			type: mimeType,
		},
	];
};

export const getCloudflarePictureData = (initialSrc, origin, options) => {
	const [, originalfilePath] = initialSrc.split(origin);

	const sources = getCloudflareSources(originalfilePath, origin, options);
	const src = getCloudflareSrc(originalfilePath, origin, options);

	return { src, sources };
};

// params: width, height, fit, isLossless
export const useSources = (src, options = {}) => {
	const [cloudflareSources] = CLOUDFLARE_ORIGINS
		.filter((origin) => src.includes(origin)) // find matching origin
		.map((origin) => getCloudflarePictureData(src, origin, options));

	if (cloudflareSources) {
		return cloudflareSources;
	}

	if (src.includes(UNSPLASH_ORIGIN)) {
		return getUnsplashSources(src, options);
	}

	return src; // do nothing
};
