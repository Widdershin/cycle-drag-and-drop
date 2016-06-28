import xs from 'xstream';

export default function preventDefaultDriver (event$) {
  event$.addListener({
    next (event) {
      event.preventDefault();
    },

    error (err) {},

    complete () {}
  });
}
