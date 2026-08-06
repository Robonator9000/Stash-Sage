export function setFullscreenOpen(open: boolean) {
  document.documentElement.setAttribute('data-fullscreen', open ? 'true' : 'false');
  document.body.classList.toggle('has-fullscreen', open);
}
