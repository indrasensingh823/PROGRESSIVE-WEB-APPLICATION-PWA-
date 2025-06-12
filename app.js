// Enhanced E-commerce PWA JavaScript with Working Features

// Global variables
let products = []
let cart = []
let wishlist = []
let currentUser = null
let categories = []
const currentFilters = {
  search: "",
  category: "",
  priceRange: "",
  sort: "",
}
let currentPage = 1
const productsPerPage = 8
let deferredPrompt
let isOnline = navigator.onLine
let selectedRating = 0
let flashSaleEndTime = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now

// Promo codes
const promoCodes = {
  SAVE10: { discount: 10, type: "percentage" },
  WELCOME20: { discount: 20, type: "percentage" },
  FLAT500: { discount: 500, type: "fixed" },
}

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
})

// Initialize application
async function initializeApp() {
  try {
    console.log("Initializing ShopEase app...")

    // Register service worker
    if ("serviceWorker" in navigator) {
      await registerServiceWorker()
    }

    // Load data
    await loadProducts()
    loadCategories()
    loadCart()
    loadWishlist()
    loadUser()

    // Set up event listeners
    setupEventListeners()

    // Initialize features
    setupInstallPrompt()
    setupOnlineOfflineHandlers()
    initializeNotifications()
    initializeTheme()
    startCountdown()
    updateActiveNavLink()

    console.log("App initialized successfully")
    showToast("Welcome to ShopEase! 🛒", "success")
  } catch (error) {
    console.error("Error initializing app:", error)
    showToast("Error loading app", "error")
  }
}

// Register service worker
async function registerServiceWorker() {
  try {
    const registration = await navigator.serviceWorker.register("service-worker.js")
    console.log("Service Worker registered:", registration)

    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing
      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          showToast("App updated! Refresh to see changes.", "info")
        }
      })
    })
  } catch (error) {
    console.error("Service Worker registration failed:", error)
  }
}

// Load products
async function loadProducts() {
  const loadingSpinner = document.getElementById("loadingSpinner")

  try {
    loadingSpinner.classList.remove("hidden")

    // Try to fetch from network first
    try {
      const response = await fetch("products.json")
      if (response.ok) {
        products = await response.json()
        // Add random ratings and reviews
        products = products.map((product) => ({
          ...product,
          rating: (Math.random() * 2 + 3).toFixed(1), 
          reviewCount: Math.floor(Math.random() * 100) + 10,
          originalPrice: product.price * (1 + Math.random() * 0.3), 
          onSale: Math.random() > 0.7, 
        }))
        localStorage.setItem("cachedProducts", JSON.stringify(products))
        console.log("Products loaded from network")
      } else {
        throw new Error("Network response was not ok")
      }
    } catch (networkError) {
      console.log("Network failed, trying cache...")
      const cachedProducts = localStorage.getItem("cachedProducts")
      if (cachedProducts) {
        products = JSON.parse(cachedProducts)
        showOfflineIndicator()
        console.log("Products loaded from cache")
      } else {
        products = getDefaultProducts()
        showToast("Using default products - network unavailable", "info")
        console.log("Using default products")
      }
    }
  } catch (error) {
    console.error("Error loading products:", error)
    products = getDefaultProducts()
    showToast("Error loading products, using defaults", "error")
  } finally {
    loadingSpinner.classList.add("hidden")
    displayProducts()
    displayDeals()
  }
}

// Get default products (fallback)
function getDefaultProducts() {
  return [
    {
      id: "1",
      name: "Wireless Headphones",
      price: 8299,
      description: "Premium wireless headphones with noise cancellation and long battery life.",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop&crop=center",
      category: "electronics",
      inStock: true,
      rating: "4.5",
      reviewCount: 89,
      onSale: true,
      originalPrice: 10799,
    },
    {
      id: "2",
      name: "Smart Watch",
      price: 20749,
      description: "Track your fitness, receive notifications, and more with this smart watch.",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop&crop=center",
      category: "electronics",
      inStock: true,
      rating: "4.7",
      reviewCount: 156,
      onSale: false,
    },
    {
      id: "3",
      name: "Leather Wallet",
      price: 4149,
      description: "Genuine leather wallet with multiple card slots and RFID protection.",
      image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=400&fit=crop&crop=center",
      category: "accessories",
      inStock: true,
      rating: "4.3",
      reviewCount: 67,
      onSale: false,
    },
    {
      id: "4",
      name: "Cotton T-Shirt",
      price: 1659,
      description: "Comfortable cotton t-shirt, perfect for everyday wear.",
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&crop=center",
      category: "clothing",
      inStock: true,
      rating: "4.1",
      reviewCount: 234,
      onSale: true,
      originalPrice: 2499,
    },
    {
      id: "5",
      name: "Desk Lamp",
      price: 2899,
      description: "Adjustable desk lamp with multiple brightness levels.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=center",
      category: "home",
      inStock: true,
      rating: "4.4",
      reviewCount: 78,
      onSale: false,
    },
    {
      id: "6",
      name: "Coffee Mug",
      price: 1249,
      description: "Ceramic coffee mug with a minimalist design.",
      image: "https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=400&h=400&fit=crop&crop=center",
      category: "home",
      inStock: true,
      rating: "4.2",
      reviewCount: 45,
      onSale: true,
      originalPrice: 1659,
    },
  ]
}

// Load categories
function loadCategories() {
  const uniqueCategories = [...new Set(products.map((p) => p.category))]
  categories = uniqueCategories.map((cat) => ({
    name: cat,
    icon: getCategoryIcon(cat),
    count: products.filter((p) => p.category === cat).length,
  }))

  displayCategories()
  populateCategoryFilter()
}

// Get category icon
function getCategoryIcon(category) {
  const icons = {
    electronics: "📱",
    clothing: "👕",
    accessories: "👜",
    home: "🏠",
    stationery: "📝",
    sports: "⚽",
    books: "📚",
    beauty: "💄",
  }
  return icons[category] || "📦"
}

// Display categories
function displayCategories() {
  const categoriesGrid = document.getElementById("categoriesGrid")

  categoriesGrid.innerHTML = categories
    .map(
      (category) => `
    <div class="category-card" onclick="filterByCategory('${category.name}')">
      <span class="category-icon">${category.icon}</span>
      <div class="category-name">${category.name.charAt(0).toUpperCase() + category.name.slice(1)}</div>
      <div class="category-count">${category.count} products</div>
    </div>
  `,
    )
    .join("")
}

// Display deals
function displayDeals() {
  const dealsGrid = document.getElementById("dealsGrid")
  const dealProducts = products.filter((p) => p.onSale).slice(0, 4)

  dealsGrid.innerHTML = dealProducts.map((product) => createProductCard(product)).join("")
}

// Display products
function displayProducts() {
  let filteredProducts = [...products]

  // Apply filters
  if (currentFilters.search) {
    filteredProducts = filteredProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(currentFilters.search.toLowerCase()) ||
        product.description.toLowerCase().includes(currentFilters.search.toLowerCase()) ||
        product.category.toLowerCase().includes(currentFilters.search.toLowerCase()),
    )
  }

  if (currentFilters.category) {
    filteredProducts = filteredProducts.filter((product) => product.category === currentFilters.category)
  }

  if (currentFilters.priceRange) {
    const [min, max] = currentFilters.priceRange.split("-").map((p) => p.replace("+", ""))
    filteredProducts = filteredProducts.filter((product) => {
      if (max) {
        return product.price >= Number.parseFloat(min) && product.price <= Number.parseFloat(max)
      } else {
        return product.price >= Number.parseFloat(min)
      }
    })
  }

  // Apply sorting
  if (currentFilters.sort) {
    switch (currentFilters.sort) {
      case "name-asc":
        filteredProducts.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "name-desc":
        filteredProducts.sort((a, b) => b.name.localeCompare(a.name))
        break
      case "price-asc":
        filteredProducts.sort((a, b) => a.price - b.price)
        break
      case "price-desc":
        filteredProducts.sort((a, b) => b.price - a.price)
        break
    }
  }

  // Pagination
  const startIndex = (currentPage - 1) * productsPerPage
  const endIndex = startIndex + productsPerPage
  const paginatedProducts = filteredProducts.slice(0, endIndex)

  const productsGrid = document.getElementById("productsGrid")

  if (paginatedProducts.length === 0) {
    productsGrid.innerHTML = '<div class="text-center"><p>No products found matching your criteria.</p></div>'
    document.getElementById("loadMoreBtn").style.display = "none"
    return
  }

  productsGrid.innerHTML = paginatedProducts.map((product) => createProductCard(product)).join("")

  // Show/hide load more button
  const loadMoreBtn = document.getElementById("loadMoreBtn")
  if (endIndex >= filteredProducts.length) {
    loadMoreBtn.style.display = "none"
  } else {
    loadMoreBtn.style.display = "block"
  }
}

// Create product card HTML
function createProductCard(product) {
  const isInWishlist = wishlist.some((item) => item.id === product.id)
  const salePrice = product.onSale ? Math.round(product.price * 0.8) : product.price

  return `
    <div class="product-card ${product.onSale ? "on-sale" : ""}" onclick="showProductDetails('${product.id}')">
      <div class="product-image">
        <button class="product-wishlist ${isInWishlist ? "active" : ""}" 
                onclick="event.stopPropagation(); toggleWishlist('${product.id}')">
          ❤️
        </button>
        <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div class="product-image-fallback" style="display: none; align-items: center; justify-content: center; width: 100%; height: 100%; background: #f3f4f6; color: #6b7280; font-size: 3rem;">
          📦
        </div>
      </div>
      <div class="product-info">
        <h3 class="product-name">${product.name}</h3>
        <div class="product-price ${product.onSale ? "on-sale" : ""}">
          ₹${salePrice.toLocaleString("en-IN")}
          ${product.onSale ? `<span class="original-price">₹${product.price.toLocaleString("en-IN")}</span>` : ""}
        </div>
        <div class="product-rating">
          <span class="stars">${"⭐".repeat(Math.floor(product.rating))}</span>
          <span class="rating-text">${product.rating} (${product.reviewCount})</span>
        </div>
        <p class="product-description">${product.description}</p>
        <div class="product-actions">
          <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); addToCart('${product.id}')">
            Add to Cart
          </button>
          <button class="btn btn-secondary btn-small" onclick="event.stopPropagation(); showProductDetails('${product.id}')">
            View Details
          </button>
        </div>
      </div>
    </div>
  `
}

// Filter by category
function filterByCategory(category) {
  currentFilters.category = category
  currentPage = 1
  displayProducts()
  scrollToSection("products")

  // Update category filter dropdown
  document.getElementById("categoryFilter").value = category
}

// Populate category filter dropdown
function populateCategoryFilter() {
  const categoryFilter = document.getElementById("categoryFilter")
  categoryFilter.innerHTML =
    '<option value="">All Categories</option>' +
    categories
      .map((cat) => `<option value="${cat.name}">${cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}</option>`)
      .join("")
}

// Search products
function searchProducts() {
  const searchInput = document.getElementById("searchInput")
  currentFilters.search = searchInput.value
  currentPage = 1
  displayProducts()
}

// Apply filters
function applyFilters() {
  const categoryFilter = document.getElementById("categoryFilter")
  const priceFilter = document.getElementById("priceFilter")
  const sortFilter = document.getElementById("sortFilter")

  currentFilters.category = categoryFilter.value
  currentFilters.priceRange = priceFilter.value
  currentFilters.sort = sortFilter.value
  currentPage = 1

  displayProducts()
}

// Load more products
function loadMoreProducts() {
  currentPage++
  displayProducts()
}

// Show product details modal
function showProductDetails(productId) {
  const product = products.find((p) => p.id === productId)
  if (!product) return

  const modal = document.getElementById("productModal")
  const title = document.getElementById("productTitle")
  const details = document.getElementById("productDetails")

  title.textContent = product.name

  const salePrice = product.onSale ? Math.round(product.price * 0.8) : product.price

  details.innerHTML = `
    <div class="product-detail-image">
      <img src="${product.image}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
      <div class="product-image-fallback" style="display: none; align-items: center; justify-content: center; width: 100%; height: 100%; background: #f3f4f6; color: #6b7280; font-size: 6rem; border-radius: 12px;">
        📦
      </div>
    </div>
    <div class="product-detail-info">
      <h3>${product.name}</h3>
      <div class="product-detail-price ${product.onSale ? "on-sale" : ""}">
        ₹${salePrice.toLocaleString("en-IN")}
        ${product.onSale ? `<span class="original-price">₹${product.price.toLocaleString("en-IN")}</span>` : ""}
      </div>
      <div class="product-rating">
        <span class="stars">${"⭐".repeat(Math.floor(product.rating))}</span>
        <span class="rating-text">${product.rating} (${product.reviewCount} reviews)</span>
      </div>
      <div class="stock-status ${product.inStock ? "in-stock" : "out-of-stock"}">
        ${product.inStock ? "In Stock" : "Out of Stock"}
      </div>
      <p class="product-detail-description">${product.description}</p>
      <div class="quantity-controls">
        <button class="quantity-btn" onclick="changeQuantity(-1)">-</button>
        <span class="quantity" id="modalQuantity">1</span>
        <button class="quantity-btn" onclick="changeQuantity(1)">+</button>
      </div>
      <br><br>
      <div style="display: flex; gap: 1rem;">
        <button class="btn btn-primary" onclick="addToCartFromModal('${product.id}')" ${!product.inStock ? "disabled" : ""}>
          Add to Cart
        </button>
        <button class="btn btn-secondary" onclick="toggleWishlist('${product.id}')">
          ${wishlist.some((item) => item.id === product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
        </button>
      </div>
    </div>
  `

  loadProductReviews(productId)
  modal.classList.remove("hidden")
}

// Load product reviews
function loadProductReviews(productId) {
  const reviewsContainer = document.getElementById("reviewsContainer")
  const savedReviews = JSON.parse(localStorage.getItem(`reviews_${productId}`) || "[]")

  if (savedReviews.length === 0) {
    reviewsContainer.innerHTML = "<p>No reviews yet. Be the first to review this product!</p>"
    return
  }

  reviewsContainer.innerHTML = savedReviews
    .map(
      (review) => `
    <div class="review">
      <div class="review-header">
        <span class="review-author">${review.author}</span>
        <span class="review-date">${new Date(review.date).toLocaleDateString()}</span>
      </div>
      <div class="review-rating">${"⭐".repeat(review.rating)}</div>
      <div class="review-text">${review.text}</div>
    </div>
  `,
    )
    .join("")
}

// Add review
function addReview() {
  const productId = document.getElementById("productTitle").textContent
  const reviewText = document.getElementById("reviewText").value

  if (!selectedRating || !reviewText.trim()) {
    showToast("Please provide a rating and review text", "error")
    return
  }

  if (!currentUser) {
    showToast("Please login to add a review", "error")
    return
  }

  const review = {
    author: currentUser.name,
    rating: selectedRating,
    text: reviewText,
    date: new Date().toISOString(),
  }

  const product = products.find((p) => p.name === productId)
  const savedReviews = JSON.parse(localStorage.getItem(`reviews_${product.id}`) || "[]")
  savedReviews.push(review)
  localStorage.setItem(`reviews_${product.id}`, JSON.stringify(savedReviews))

  // Reset form
  selectedRating = 0
  document.getElementById("reviewText").value = ""
  updateStarRating()

  // Reload reviews
  loadProductReviews(product.id)
  showToast("Review added successfully!", "success")
}

// Update star rating
function updateStarRating() {
  const stars = document.querySelectorAll("#ratingStars .star")
  stars.forEach((star, index) => {
    star.classList.toggle("active", index < selectedRating)
  })
}

// Close product modal
function closeProductModal() {
  document.getElementById("productModal").classList.add("hidden")
  document.getElementById("modalQuantity").textContent = "1"
  selectedRating = 0
  updateStarRating()
}

// Change quantity in modal
function changeQuantity(change) {
  const quantityElement = document.getElementById("modalQuantity")
  let quantity = Number.parseInt(quantityElement.textContent)
  quantity = Math.max(1, quantity + change)
  quantityElement.textContent = quantity
}

// Add to cart from modal
function addToCartFromModal(productId) {
  const quantity = Number.parseInt(document.getElementById("modalQuantity").textContent)
  addToCart(productId, quantity)
  closeProductModal()
}

// ===== WISHLIST FUNCTIONS =====
function toggleWishlist(productId) {
  const product = products.find((p) => p.id === productId)
  if (!product) return

  const existingIndex = wishlist.findIndex((item) => item.id === productId)

  if (existingIndex >= 0) {
    wishlist.splice(existingIndex, 1)
    showToast(`${product.name} removed from wishlist`, "info")
  } else {
    wishlist.push(product)
    showToast(`${product.name} added to wishlist`, "success")
  }

  saveWishlist()
  updateWishlistCount()
  displayProducts() // Refresh to update wishlist buttons
}

function showWishlist() {
  const modal = document.getElementById("wishlistModal")
  displayWishlistItems()
  modal.classList.remove("hidden")
}

function closeWishlist() {
  document.getElementById("wishlistModal").classList.add("hidden")
}

function displayWishlistItems() {
  const wishlistItems = document.getElementById("wishlistItems")

  if (wishlist.length === 0) {
    wishlistItems.innerHTML = '<div class="empty-cart"><p>Your wishlist is empty</p></div>'
    return
  }

  wishlistItems.innerHTML = wishlist
    .map(
      (item) => `
    <div class="wishlist-item">
      <div class="wishlist-item-image">
        <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div class="product-image-fallback" style="display: none; align-items: center; justify-content: center; width: 60px; height: 60px; background: #f3f4f6; color: #6b7280; font-size: 1.5rem; border-radius: 8px;">
          📦
        </div>
      </div>
      <div class="wishlist-item-info">
        <div class="wishlist-item-name">${item.name}</div>
        <div class="wishlist-item-price">₹${item.price.toLocaleString("en-IN")}</div>
      </div>
      <div class="wishlist-actions">
        <button class="btn btn-primary btn-small" onclick="addToCart('${item.id}')">
          Add to Cart
        </button>
        <button class="btn btn-danger btn-small" onclick="toggleWishlist('${item.id}')">
          Remove
        </button>
      </div>
    </div>
  `,
    )
    .join("")
}

function saveWishlist() {
  localStorage.setItem("wishlist", JSON.stringify(wishlist))
}

function loadWishlist() {
  const savedWishlist = localStorage.getItem("wishlist")
  if (savedWishlist) {
    wishlist = JSON.parse(savedWishlist)
  }
  updateWishlistCount()
}

function updateWishlistCount() {
  const wishlistCount = document.getElementById("wishlistCount")
  wishlistCount.textContent = wishlist.length
  wishlistCount.style.display = wishlist.length > 0 ? "flex" : "none"
}

// ===== CART FUNCTIONS =====
function addToCart(productId, quantity = 1) {
  const product = products.find((p) => p.id === productId)
  if (!product || !product.inStock) {
    showToast("Product not available", "error")
    return
  }

  const existingItem = cart.find((item) => item.id === productId)
  const price = product.onSale ? Math.round(product.price * 0.8) : product.price

  if (existingItem) {
    existingItem.quantity += quantity
  } else {
    cart.push({
      ...product,
      quantity: quantity,
      price: price,
    })
  }

  saveCart()
  updateCartCount()
  showToast(`${product.name} added to cart`, "success")
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId)
  saveCart()
  updateCartCount()
  displayCartItems()
  showToast("Item removed from cart", "info")
}

function updateCartQuantity(productId, newQuantity) {
  if (newQuantity < 1) {
    removeFromCart(productId)
    return
  }

  const item = cart.find((item) => item.id === productId)
  if (item) {
    item.quantity = newQuantity
    saveCart()
    updateCartCount()
    displayCartItems()
  }
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart))
}

function loadCart() {
  const savedCart = localStorage.getItem("cart")
  if (savedCart) {
    cart = JSON.parse(savedCart)
  }
  updateCartCount()
}

function updateCartCount() {
  const cartCount = document.getElementById("cartCount")
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  cartCount.textContent = totalItems
  cartCount.style.display = totalItems > 0 ? "flex" : "none"
}

function showCart() {
  const modal = document.getElementById("cartModal")
  displayCartItems()
  modal.classList.remove("hidden")
}

function closeCart() {
  document.getElementById("cartModal").classList.add("hidden")
}

function displayCartItems() {
  const cartItems = document.getElementById("cartItems")
  const cartSubtotal = document.getElementById("cartSubtotal")
  const cartDiscount = document.getElementById("cartDiscount")
  const shippingCost = document.getElementById("shippingCost")
  const cartTotal = document.getElementById("cartTotal")

  if (cart.length === 0) {
    cartItems.innerHTML = '<div class="empty-cart"><p>Your cart is empty</p></div>'
    cartSubtotal.textContent = "0"
    cartDiscount.textContent = "0"
    cartTotal.textContent = "0"
    return
  }

  cartItems.innerHTML = cart
    .map(
      (item) => `
    <div class="cart-item">
      <div class="cart-item-image">
        <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div class="product-image-fallback" style="display: none; align-items: center; justify-content: center; width: 60px; height: 60px; background: #f3f4f6; color: #6b7280; font-size: 1.5rem; border-radius: 8px;">
          📦
        </div>
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">₹${item.price.toLocaleString("en-IN")}</div>
      </div>
      <div class="quantity-controls">
        <button class="quantity-btn" onclick="updateCartQuantity('${item.id}', ${item.quantity - 1})">-</button>
        <span class="quantity">${item.quantity}</span>
        <button class="quantity-btn" onclick="updateCartQuantity('${item.id}', ${item.quantity + 1})">+</button>
      </div>
      <button class="remove-btn" onclick="removeFromCart('${item.id}')">Remove</button>
    </div>
  `,
    )
    .join("")

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discount = Number.parseFloat(localStorage.getItem("appliedDiscount") || "0")
  const shipping = subtotal > 4000 ? 0 : 499
  const total = subtotal - discount + shipping

  cartSubtotal.textContent = subtotal.toLocaleString("en-IN")
  cartDiscount.textContent = discount.toLocaleString("en-IN")
  shippingCost.textContent = shipping === 0 ? "Free" : `₹${shipping.toLocaleString("en-IN")}`
  cartTotal.textContent = total.toLocaleString("en-IN")
}

// Promo code functionality
function applyPromoCode() {
  const promoInput = document.getElementById("promoInput")
  const code = promoInput.value.toUpperCase().trim()

  if (!code) {
    showToast("Please enter a promo code", "error")
    return
  }

  if (promoCodes[code]) {
    const promo = promoCodes[code]
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    let discount = 0

    if (promo.type === "percentage") {
      discount = subtotal * (promo.discount / 100)
    } else {
      discount = promo.discount
    }

    localStorage.setItem("appliedDiscount", discount.toString())
    localStorage.setItem("appliedPromoCode", code)

    displayCartItems()
    showToast(`Promo code applied! You saved ₹${discount.toLocaleString("en-IN")}`, "success")
    promoInput.value = ""
  } else {
    showToast("Invalid promo code", "error")
  }
}

// Checkout function
function checkout() {
  if (cart.length === 0) {
    showToast("Your cart is empty", "error")
    return
  }

  if (!currentUser) {
    showToast("Please login to checkout", "error")
    showUserModal()
    return
  }

  // Simulate checkout process
  showToast("Processing your order...", "info")

  setTimeout(() => {
    const orderNumber = Math.random().toString(36).substr(2, 9).toUpperCase()

    // Save order to user's history
    const order = {
      id: orderNumber,
      items: [...cart],
      total: document.getElementById("cartTotal").textContent,
      date: new Date().toISOString(),
      status: "confirmed",
    }

    const orderHistory = JSON.parse(localStorage.getItem(`orders_${currentUser.email}`) || "[]")
    orderHistory.push(order)
    localStorage.setItem(`orders_${currentUser.email}`, JSON.stringify(orderHistory))

    // Clear cart
    cart = []
    saveCart()
    updateCartCount()
    closeCart()

    // Clear applied discount
    localStorage.removeItem("appliedDiscount")
    localStorage.removeItem("appliedPromoCode")

    showToast(`Order #${orderNumber} placed successfully!`, "success")

    // Send notification if enabled
    if (localStorage.getItem("notificationsEnabled") === "true") {
      setTimeout(() => {
        showLocalNotification(
          "Order Confirmed!",
          `Your order #${orderNumber} has been confirmed and will be shipped soon.`,
        )
      }, 2000)
    }
  }, 2000)
}

// ===== USER AUTHENTICATION =====
function showUserModal() {
  const modal = document.getElementById("userModal")

  if (currentUser) {
    showUserProfile()
  } else {
    showLogin()
  }

  modal.classList.remove("hidden")
}

function closeUserModal() {
  document.getElementById("userModal").classList.add("hidden")
}

function showLogin() {
  document.getElementById("loginForm").classList.remove("hidden")
  document.getElementById("signupForm").classList.add("hidden")
  document.getElementById("userProfile").classList.add("hidden")
  document.getElementById("userModalTitle").textContent = "Login"
}

function showSignup() {
  document.getElementById("loginForm").classList.add("hidden")
  document.getElementById("signupForm").classList.remove("hidden")
  document.getElementById("userProfile").classList.add("hidden")
  document.getElementById("userModalTitle").textContent = "Sign Up"
}

function showUserProfile() {
  document.getElementById("loginForm").classList.add("hidden")
  document.getElementById("signupForm").classList.add("hidden")
  document.getElementById("userProfile").classList.remove("hidden")
  document.getElementById("userModalTitle").textContent = "My Account"

  document.getElementById("userName").textContent = currentUser.name
  document.getElementById("userEmail").textContent = currentUser.email
  document.getElementById("memberSince").textContent = new Date(currentUser.joinDate).toLocaleDateString()
}

function login() {
  const email = document.getElementById("loginEmail").value
  const password = document.getElementById("loginPassword").value

  if (!email || !password) {
    showToast("Please fill in all fields", "error")
    return
  }

  // Simple validation (in real app, this would be server-side)
  const savedUser = localStorage.getItem(`user_${email}`)
  if (savedUser) {
    const user = JSON.parse(savedUser)
    if (user.password === password) {
      currentUser = user
      localStorage.setItem("currentUser", JSON.stringify(currentUser))
      updateUserButton()
      closeUserModal()
      showToast(`Welcome back, ${currentUser.name}!`, "success")
    } else {
      showToast("Invalid password", "error")
    }
  } else {
    showToast("User not found", "error")
  }
}

function signup() {
  const name = document.getElementById("signupName").value
  const email = document.getElementById("signupEmail").value
  const password = document.getElementById("signupPassword").value
  const confirmPassword = document.getElementById("signupConfirmPassword").value

  if (!name || !email || !password || !confirmPassword) {
    showToast("Please fill in all fields", "error")
    return
  }

  if (password !== confirmPassword) {
    showToast("Passwords do not match", "error")
    return
  }

  if (password.length < 6) {
    showToast("Password must be at least 6 characters", "error")
    return
  }

  // Check if user already exists
  if (localStorage.getItem(`user_${email}`)) {
    showToast("User already exists", "error")
    return
  }

  // Create new user
  const newUser = {
    name,
    email,
    password,
    joinDate: new Date().toISOString(),
  }

  localStorage.setItem(`user_${email}`, JSON.stringify(newUser))
  currentUser = newUser
  localStorage.setItem("currentUser", JSON.stringify(currentUser))

  updateUserButton()
  closeUserModal()
  showToast(`Welcome to ShopEase, ${currentUser.name}!`, "success")
}

function logout() {
  currentUser = null
  localStorage.removeItem("currentUser")
  updateUserButton()
  closeUserModal()
  showToast("Logged out successfully", "info")
}

function loadUser() {
  const savedUser = localStorage.getItem("currentUser")
  if (savedUser) {
    currentUser = JSON.parse(savedUser)
    updateUserButton()
  }
}

function updateUserButton() {
  const userBtn = document.getElementById("userBtn")
  if (currentUser) {
    userBtn.title = `Logged in as ${currentUser.name}`
    userBtn.style.color = "#4f46e5"
  } else {
    userBtn.title = "Login / Sign Up"
    userBtn.style.color = ""
  }
}

function viewOrderHistory() {
  if (!currentUser) return

  const orderHistory = JSON.parse(localStorage.getItem(`orders_${currentUser.email}`) || "[]")

  if (orderHistory.length === 0) {
    showToast("No orders found", "info")
    return
  }

  let historyHtml = '<h3>Order History</h3><div style="max-height: 300px; overflow-y: auto;">'

  orderHistory.forEach((order) => {
    historyHtml += `
      <div style="border: 1px solid var(--border-primary); padding: 1rem; margin-bottom: 1rem; border-radius: 0.5rem;">
        <div><strong>Order #${order.id}</strong></div>
        <div>Date: ${new Date(order.date).toLocaleDateString()}</div>
        <div>Total: ₹${order.total}</div>
        <div>Status: ${order.status}</div>
        <div>Items: ${order.items.length}</div>
      </div>
    `
  })

  historyHtml += "</div>"

  document.querySelector("#userProfile").innerHTML =
    historyHtml + '<button class="btn btn-secondary" onclick="showUserProfile()">Back to Profile</button>'
}

function editProfile() {
  showToast("Profile editing feature coming soon!", "info")
}

// ===== THEME FUNCTIONALITY =====
function initializeTheme() {
  const savedTheme = localStorage.getItem("theme") || "light"
  document.body.className = `${savedTheme}-theme`
  updateThemeButton()
  console.log(`Theme initialized: ${savedTheme}`)
}

function toggleTheme() {
  const currentTheme = document.body.classList.contains("dark-theme") ? "dark" : "light"
  const newTheme = currentTheme === "light" ? "dark" : "light"

  document.body.className = `${newTheme}-theme`
  localStorage.setItem("theme", newTheme)
  updateThemeButton()

  showToast(`Switched to ${newTheme} mode`, "info")
  console.log(`Theme switched to: ${newTheme}`)
}

function updateThemeButton() {
  const themeBtn = document.getElementById("themeToggle")
  const isDark = document.body.classList.contains("dark-theme")
  themeBtn.textContent = isDark ? "☀️" : "🌙"
  themeBtn.title = isDark ? "Switch to light mode" : "Switch to dark mode"
}

// ===== COUNTDOWN TIMER =====
function startCountdown() {
  function updateCountdown() {
    const now = new Date().getTime()
    const distance = flashSaleEndTime.getTime() - now

    if (distance < 0) {
      // Reset timer for next day
      flashSaleEndTime = new Date(Date.now() + 24 * 60 * 60 * 1000)
      return
    }

    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((distance % (1000 * 60)) / 1000)

    document.getElementById("hours").textContent = hours.toString().padStart(2, "0")
    document.getElementById("minutes").textContent = minutes.toString().padStart(2, "0")
    document.getElementById("seconds").textContent = seconds.toString().padStart(2, "0")
  }

  updateCountdown()
  setInterval(updateCountdown, 1000)
}

// ===== NAVIGATION =====
function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId)
  if (section) {
    section.scrollIntoView({ behavior: "smooth" })
  }
}

function updateActiveNavLink() {
  const sections = ["home", "categories", "deals", "products", "about"]
  const navLinks = document.querySelectorAll(".nav-link")

  function checkActiveSection() {
    let activeSection = "home"

    sections.forEach((sectionId) => {
      const section = document.getElementById(sectionId)
      if (section) {
        const rect = section.getBoundingClientRect()
        if (rect.top <= 100 && rect.bottom >= 100) {
          activeSection = sectionId
        }
      }
    })

    navLinks.forEach((link) => {
      link.classList.remove("active")
      if (link.getAttribute("href") === `#${activeSection}`) {
        link.classList.add("active")
      }
    })
  }

  window.addEventListener("scroll", checkActiveSection)
  checkActiveSection()
}

// Mobile navigation
function toggleMobileNav() {
  const mobileNav = document.getElementById("mobileNav")
  mobileNav.classList.toggle("hidden")
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
  console.log("Setting up event listeners...")

  // Navigation
  document.getElementById("cartBtn").addEventListener("click", showCart)
  document.getElementById("wishlistBtn").addEventListener("click", showWishlist)
  document.getElementById("userBtn").addEventListener("click", showUserModal)
  document.getElementById("themeToggle").addEventListener("click", toggleTheme)
  document.getElementById("menuBtn").addEventListener("click", toggleMobileNav)

  // Search
  const searchInput = document.getElementById("searchInput")
  searchInput.addEventListener("input", searchProducts)
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchProducts()
  })

  // Filters
  document.getElementById("categoryFilter").addEventListener("change", applyFilters)
  document.getElementById("priceFilter").addEventListener("change", applyFilters)
  document.getElementById("sortFilter").addEventListener("change", applyFilters)

  // Load more
  document.getElementById("loadMoreBtn").addEventListener("click", loadMoreProducts)

  // Star rating
  document.querySelectorAll("#ratingStars .star").forEach((star, index) => {
    star.addEventListener("click", () => {
      selectedRating = index + 1
      updateStarRating()
    })
  })

  // Mobile nav links
  document.querySelectorAll(".mobile-nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()
      const target = link.getAttribute("href").substring(1)
      scrollToSection(target)
      toggleMobileNav()
    })
  })

  // Nav links
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()
      const target = link.getAttribute("href").substring(1)
      scrollToSection(target)
    })
  })

  // Close modals when clicking outside
  document.addEventListener("click", (event) => {
    if (event.target.classList.contains("modal")) {
      event.target.classList.add("hidden")
    }

    // Close mobile nav when clicking outside
    if (!event.target.closest(".mobile-nav") && !event.target.closest("#menuBtn")) {
      document.getElementById("mobileNav").classList.add("hidden")
    }
  })

  // Notification button
  document.getElementById("notificationBtn").addEventListener("click", toggleNotifications)

  console.log("Event listeners set up successfully")
}

// ===== NOTIFICATION FUNCTIONS =====
function initializeNotifications() {
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.log("Push notifications are not supported")
    return
  }
  updateNotificationButtonState()
}

function toggleNotifications() {
  const isEnabled = localStorage.getItem("notificationsEnabled") === "true"

  if (isEnabled) {
    unsubscribeFromNotifications()
  } else {
    subscribeToNotifications()
  }
}

function subscribeToNotifications() {
  if (Notification.permission === "granted") {
    localStorage.setItem("notificationsEnabled", "true")
    updateNotificationButtonState()
    showToast("Notifications enabled!", "success")
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        localStorage.setItem("notificationsEnabled", "true")
        updateNotificationButtonState()
        showToast("Notifications enabled!", "success")
      } else {
        showToast("Notification permission denied", "error")
      }
    })
  } else {
    showToast("Notifications are blocked. Please enable them in browser settings.", "error")
  }
}

function unsubscribeFromNotifications() {
  localStorage.setItem("notificationsEnabled", "false")
  updateNotificationButtonState()
  showToast("Notifications disabled", "info")
}

function updateNotificationButtonState() {
  const notificationBtn = document.getElementById("notificationBtn")
  const isEnabled = localStorage.getItem("notificationsEnabled") === "true"

  if (isEnabled) {
    notificationBtn.style.color = "#4f46e5"
    notificationBtn.title = "Disable notifications"
  } else {
    notificationBtn.style.color = ""
    notificationBtn.title = "Enable notifications"
  }
}

function showLocalNotification(title, body) {
  if (Notification.permission === "granted") {
    new Notification(title, {
      body: body,
      icon: "icons/icon-192.png",
      badge: "icons/icon-192.png",
    })
  }
}

// ===== INSTALL PROMPT AND OFFLINE FUNCTIONS =====
function setupInstallPrompt() {
  // Check if app is already installed
  if (window.matchMedia("(display-mode: standalone)").matches) {
    return
  }

  // Listen for beforeinstallprompt event
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault()
    deferredPrompt = e
    showInstallPrompt()
  })

  // For iOS devices
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  if (isIOS) {
    setTimeout(() => {
      showInstallPrompt(true)
    }, 5000)
  }
}

function showInstallPrompt(isIOS = false) {
  const installPrompt = document.getElementById("installPrompt")
  const installMessage = document.getElementById("installMessage")
  const installBtn = document.getElementById("installBtn")
  const dismissBtn = document.getElementById("dismissBtn")

  if (isIOS) {
    installMessage.textContent = 'Tap the share button and select "Add to Home Screen"'
    installBtn.style.display = "none"
  } else {
    installMessage.textContent = "Install our app for a better experience"
    installBtn.style.display = "block"
  }

  installPrompt.classList.remove("hidden")

  installBtn.onclick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const outcome = await deferredPrompt.userChoice
      if (outcome.outcome === "accepted") {
        showToast("App installed successfully!", "success")
      }
      deferredPrompt = null
    }
    installPrompt.classList.add("hidden")
  }

  dismissBtn.onclick = () => {
    installPrompt.classList.add("hidden")
  }
}

function setupOnlineOfflineHandlers() {
  window.addEventListener("online", () => {
    isOnline = true
    hideOfflineIndicator()
    showToast("You are back online!", "success")
    loadProducts()
  })

  window.addEventListener("offline", () => {
    isOnline = false
    showOfflineIndicator()
    showToast("You are offline. Using cached data.", "info")
  })

  if (!isOnline) {
    showOfflineIndicator()
  }
}

function showOfflineIndicator() {
  document.getElementById("offlineIndicator").classList.remove("hidden")
}

function hideOfflineIndicator() {
  document.getElementById("offlineIndicator").classList.add("hidden")
}

// ===== TOAST NOTIFICATION FUNCTION =====
function showToast(message, type = "info") {
  const toastContainer = document.getElementById("toastContainer")
  const toast = document.createElement("div")
  toast.className = `toast ${type}`
  toast.innerHTML = `<div>${message}</div>`

  toastContainer.appendChild(toast)

  setTimeout(() => {
    toast.remove()
  }, 3000)
}

// ===== DEMO NOTIFICATION =====
setTimeout(() => {
  if (localStorage.getItem("notificationsEnabled") === "true") {
    showLocalNotification(
      "Welcome to Enhanced ShopEase!",
      "Explore our new features: dark mode, wishlist, user accounts, and more!",
    )
  }
}, 15000)

console.log("ShopEase app script loaded successfully")
