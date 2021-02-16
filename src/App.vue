<template>
  <section class="bg-gray-100 p-4 min-h-screen">
            <!-- url="https://assets.zyrosite.com//A1ak13JjewU4K18q/img-A85N2LP5vxsarKk3-w1370.jpg" -->
    <div class="container mx-auto">
      <div class="flex flex-wrap">
        <div class="w-full">
          <Image
            url="https://images.unsplash.com/photo-1543213324-024b81adc95f"
            :width="666"
            :height="368"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import Image from "./Image.vue";

export default {
  components: {
    Image,
  },
};
</script>
