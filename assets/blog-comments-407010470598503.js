import { zcAdapter } from './network-adapter-730892702895239.js';
(() => {
  class BlogComments extends HTMLElement {
    constructor() {
      super();
      this.blogId = this.dataset.blogId;
    }

    connectedCallback() {
      this.form = this.querySelector("#blogCommentForm");
      this.submitBtn = this.querySelector("#submitComment");
      this.contentInput = this.querySelector("#commentContent");
      this.guestCheckbox = this.querySelector("#guestCheckbox");
      this.commentsWrapper = this.querySelector("#commentsWrapper");
      this.currentUser = null;
      this.currentPage = 1;
      this.fetchCurrentUser().then(() => {
        this.setupMainFormBehavior();
        this.bindEvents();
        this.fetchCommentsPage(1, { scroll: false });
      });
    }

    async fetchCurrentUser() {
      try {
        const res = await zcAdapter.getPortalUser();
        if (!res.ok) {
          return;
        }
        const data = await res.json();
        const u = data.current_user;
        this.currentUser = (u && u.zuid) ? u : null;
      } catch {
        this.currentUser = null;
      }
    }

    showError(errorElement, duration) {
      if (!errorElement) {
        return;
      }
      errorElement.classList.remove("hidden");

      if (duration) {
        setTimeout(() => {
          errorElement.classList.add("hidden");
        }, duration);
      }
    }

    hideError(errorElement) {
      if (!errorElement) {
        return;
      }
      errorElement.classList.add("hidden");
    }

    encodeHTML(str) {
      const textarea = document.createElement("textarea");
      textarea.textContent = str;
      return textarea.innerHTML;
    }

    setupMainFormBehavior() {
      if (this.currentUser) {
        this.guestCheckbox.checked = false;
      } else {
        this.guestCheckbox.checked = true;

        this.guestCheckbox.addEventListener("change", () => {
          if (!this.guestCheckbox.checked) {
            const errorElement = this.form.querySelector('[data-error="comment-login"]');
            this.showError(errorElement, 5000);
            this.guestCheckbox.checked = true;
          }
        });
      }
    }

    bindEvents() {
      this.contentInput.addEventListener("input", () => {
        const errorElement = this.form.querySelector('[data-error="comment-empty"]');
        this.hideError(errorElement);
      });
      this.submitBtn?.addEventListener("click", (event) => this.submitComment(event));

      this.commentsWrapper.addEventListener("click", (event) => {
        const commentsPageBtn = event.target.closest("[data-comments-page]");
        if (commentsPageBtn) {
          const page = parseInt(commentsPageBtn.dataset.commentsPage, 10);
          if (!isNaN(page)) {
            this.fetchCommentsPage(page);
          }
        }

        const repliesPageBtn = event.target.closest("[data-replies-page]");
        if (repliesPageBtn) {
          const commentId = repliesPageBtn.dataset.commentId;
          const page = parseInt(repliesPageBtn.dataset.repliesPage, 10);
          if (commentId && !isNaN(page)) {
            this.fetchRepliesPage(commentId, page);
          }
        }

        if (event.target.closest("[id^='viewRepliesBtn-']")) {
          this.toggleReplies(event);
        }

        if (event.target.closest("[id^='replyBtn-']")) {
          this.openReplyBox(event);
        }

        if (event.target.closest("[id^='replyCancel-']")) {
          this.cancelReply(event);
        }

        if (event.target.closest("[id^='replySubmit-']")) {
          this.submitReply(event);
        }
      });
    }

    async submitComment(event) {
      event.preventDefault();
      const content = this.encodeHTML(this.contentInput.value.trim());
      const errorElement = this.form.querySelector('[data-error="comment-empty"]');

      if (!content) {
        this.showError(errorElement);
        return;
      } else {
        this.hideError(errorElement);
      }

      const body = {
        entity_id: this.blogId,
        entity_type: "blog",
        content,
        sections: "blog-comments",
      };

      const container = this.querySelector("[data-comments-container]");
      const spinner = this.submitBtn.querySelector(".spinner");

      if (this.guestCheckbox.checked) {
        body.is_guest_user = true;
      }

      try {
        this.submitBtn.disabled = true;
        spinner.classList.remove("hidden");
        const res = await zcAdapter.fetch("/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          throw new Error("Failed to post comment");
        }

        const data = await res.json();

        if (data.sections?.["blog-comments"]) {
          container.innerHTML = data.sections["blog-comments"];
          requestAnimationFrame(() => {
            const firstComment = container.querySelector("[data-comment-id]");
            if (firstComment) {
              firstComment.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          });
        }

        this.contentInput.value = "";
      } catch (err) {
        console.error("Error submitting comment:", err);
      } finally {
        this.submitBtn.disabled = false;
        spinner.classList.add("hidden");
      }
    }

    async fetchCommentsPage(page, { scroll = true } = {}) {
      const container = this.querySelector("[data-comments-container]");
      const loader = this.querySelector("[page-loader]");

      try {
        loader.classList.remove("hidden");
        container.classList.add("hidden");

        const url = `/comments?page=${page}&entity_id=${this.blogId}&entity_type=blog&sections=blog-comments`;
        const res = await zcAdapter.fetch(url);

        if (!res.ok) {
          throw new Error("Failed to fetch comments page");
        }
        const data = await res.json();

        if (data.sections?.["blog-comments"]) {
          container.innerHTML = data.sections["blog-comments"];
          this.currentPage = page;

          if (scroll) {
            requestAnimationFrame(() => {
              const firstComment = container.querySelector("[data-comment-id]");
              if (firstComment) {
                firstComment.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            });
          }
        }
      } catch (err) {
        console.error("Error fetching comments page:", err);
      } finally {
        loader.classList.add("hidden");
        container.classList.remove("hidden");
      }
    }

    async fetchRepliesPage(commentId, page, { scroll = true } = {}) {
      const repliesWrapper = document.getElementById(`replies-${commentId}`);
      if (!repliesWrapper) {
        return;
      }

      const loader = repliesWrapper.querySelector("[page-loader]");
      const repliesContent = repliesWrapper.querySelector(".replies-content");

      if (!loader || !repliesContent) {
        console.error("Replies loader or content container not found");
        return;
      }

      try {
        loader.classList.remove("hidden");
        repliesContent.classList.add("hidden");

        const url = `/comments?page=${page}&entity_id=${this.blogId}&entity_type=blog&root_comment_id=${commentId}&sections=blog-replies`;
        const res = await zcAdapter.fetch(url);

        if (!res.ok) {
          throw new Error("Failed to fetch replies page");
        }
        const data = await res.json();

        if (data.sections?.["blog-replies"]) {
          repliesContent.innerHTML = data.sections["blog-replies"];
          if (scroll) {
            repliesWrapper.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      } catch (err) {
        console.error("Error fetching replies page:", err);
      } finally {
        loader.classList.add("hidden");
        repliesContent.classList.remove("hidden");
      }
    }

    toggleReplies(event) {
      const btn = event.target.closest("[id^='viewRepliesBtn-']");
      const commentId = btn.id.replace("viewRepliesBtn-", "");
      const repliesBox = document.getElementById(`replies-${commentId}`);
      const arrow = btn.querySelector("span");

      if (!repliesBox) {
        return;
      }

      if (repliesBox.classList.contains("open")) {
        repliesBox.style.maxHeight = repliesBox.scrollHeight + "px";
        void repliesBox.offsetHeight;
        repliesBox.style.maxHeight = "0px";
        repliesBox.classList.remove("open");
      } else {
        repliesBox.style.maxHeight = repliesBox.scrollHeight + "px";
        repliesBox.classList.add("open");
        repliesBox.addEventListener("transitionend", () => {
          if (repliesBox.classList.contains("open")) {
            repliesBox.style.maxHeight = "none";
          }
        }, { once: true });
      }
      if (arrow) {
        arrow.classList.toggle("rotate-180");
      }
    }

    expandReplyBox(replyBox) {
      replyBox.style.maxHeight = replyBox.scrollHeight + "px";
      replyBox.classList.add("open");
      replyBox.addEventListener("transitionend", () => {
        if (replyBox.classList.contains("open")) {
          replyBox.style.maxHeight = "none";
        }
      }, { once: true });
    }

    collapseReplyBox(replyBox) {
      replyBox.style.maxHeight = replyBox.scrollHeight + "px";
      void replyBox.offsetHeight;
      replyBox.style.maxHeight = "0px";
      replyBox.classList.remove("open");
    }

    openReplyBox(event) {
      const btn = event.target.closest("[id^='replyBtn-']");
      const commentId = btn.id.replace("replyBtn-", "");
      const replyBox = document.getElementById(`replyBox-${commentId}`);
      const guestCheckbox = document.getElementById(`replyGuestCheckbox-${commentId}`);
      const replyContent = document.getElementById(`replyContent-${commentId}`);
      const errorElement = replyBox.querySelector('[data-error="reply-empty"]');

      replyContent.addEventListener("input", () => {
        this.hideError(errorElement);
      });

      if (this.currentUser) {
        guestCheckbox.checked = false;
      } else {
        guestCheckbox.checked = true;

        guestCheckbox.addEventListener("change", () => {
          if (!guestCheckbox.checked) {
            const replyLoginError = replyBox.querySelector('[data-error="reply-login"]');
            this.showError(replyLoginError, 5000);
            guestCheckbox.checked = true;
          }
        });
      }

      btn.classList.add("hidden");
      this.expandReplyBox(replyBox);
    }

    cancelReply(event) {
      const btn = event.target.closest("[id^='replyCancel-']");
      const commentId = btn.id.replace("replyCancel-", "");
      const replyBox = document.getElementById(`replyBox-${commentId}`);
      const replyBtn = document.getElementById(`replyBtn-${commentId}`);
      this.collapseReplyBox(replyBox);
      replyBtn.classList.remove("hidden");
    }

    async submitReply(event) {
      const btn = event.target.closest("[id^='replySubmit-']");
      const commentId = btn.id.replace("replySubmit-", "");
      const replyContent = document.getElementById(`replyContent-${commentId}`);
      const guestCheckbox = document.getElementById(`replyGuestCheckbox-${commentId}`);
      const replyBtn = document.getElementById(`replyBtn-${commentId}`);
      const replyBox = document.getElementById(`replyBox-${commentId}`);
      const replySubmit = document.getElementById(`replySubmit-${commentId}`);
      const spinner = replySubmit.querySelector(".spinner");
      const errorElement = replyBox.querySelector('[data-error="reply-empty"]');

      const content = this.encodeHTML(replyContent.value.trim());
      if (!content) {
        this.showError(errorElement);
        return;
      } else {
        this.hideError(errorElement);
      }

      const body = {
        entity_id: this.blogId,
        entity_type: "blog",
        content,
        root_comment_id: commentId,
        sections: "blog-replies",
      };

      if (guestCheckbox.checked) {
        body.is_guest_user = true;
      }

      try {
        replySubmit.disabled = true;
        if (spinner) {
          spinner.classList.remove("hidden");
        }
        const res = await zcAdapter.fetch("/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          throw new Error("Failed to post reply");
        }

        await this.fetchRepliesPage(commentId, 1, { scroll: false });

        const viewRepliesBtn = document.getElementById(`viewRepliesBtn-${commentId}`);
        if (viewRepliesBtn) {
          viewRepliesBtn.classList.remove("hidden");
          const countEl = viewRepliesBtn.querySelector("[data-replies-count]");
          if (countEl) {
            const current = parseInt(countEl.textContent, 10) || 0;
            countEl.textContent = current + 1;
          }
        }

        const repliesWrapper = document.getElementById(`replies-${commentId}`);
        if (repliesWrapper && !repliesWrapper.classList.contains("open")) {
          requestAnimationFrame(() => {
            repliesWrapper.style.maxHeight = repliesWrapper.scrollHeight + "px";
            repliesWrapper.classList.add("open");
            repliesWrapper.addEventListener("transitionend", () => {
              if (repliesWrapper.classList.contains("open")) {
                repliesWrapper.style.maxHeight = "none";
              }
            }, { once: true });
            const arrow = document.getElementById(`viewRepliesBtn-${commentId}`)?.querySelector("span");
            if (arrow) {
              arrow.classList.add("rotate-180");
            }
          });
        }

        replyContent.value = "";
        this.collapseReplyBox(replyBox);
        replyBtn.classList.remove("hidden");
      } catch (err) {
        console.error("Error submitting reply:", err);
      } finally {
        replySubmit.disabled = false;
        if (spinner) {
          spinner.classList.add("hidden");
        }
      }
    }
  }

  if (!customElements.get("blog-comments-replies")) {
    customElements.define("blog-comments-replies", BlogComments);
  }
})();
