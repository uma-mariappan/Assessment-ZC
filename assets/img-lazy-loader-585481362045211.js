(() => { document.addEventListener('DOMContentLoaded', () => {
      const wrappers = document.querySelectorAll('shimmer-effect');
    
      wrappers.forEach(wrapper => {
        const img = wrapper.querySelector('img');
        const loader = wrapper.querySelector('.img-loader');
    
        if (!img || !loader) {
          return;
        }
    
        // Show loader initially
        loader.classList.remove('hidden');
    
        if (img.complete) {
          // Image was cached and already loaded
          handleImageLoad(img, loader);
        } else {
          img.addEventListener('load', () => handleImageLoad(img, loader));
          img.addEventListener('error', () => handleImageLoad(img, loader)); // fallback
        }
      });
    
      function handleImageLoad(img, loader) {
        loader.classList.add('hidden');
        img.classList.add('img-loaded');
      }
  });
})();
  