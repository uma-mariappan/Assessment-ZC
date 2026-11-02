(() => {
  class AccountQuote extends HTMLElement {
      
  }

  if (!customElements.get('account-quote')) {
    customElements.define('account-quote', AccountQuote);
}
})();
