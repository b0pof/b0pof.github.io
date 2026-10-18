'use strict';

const presets = {
  low: [300000, 300000, 100000, 100000],
  middle: [600000, 400000, 250000, 250000],
  high: [900000, 400000, 450000, 400000]
};

const inputs = ['zeekr-damage', 'zeekr-insurance', 'porsche-damage', 'porsche-insurance']
  .map(id => document.getElementById(id));
const presetButtons = [...document.querySelectorAll('[data-preset]')];
const error = document.getElementById('calc-error');
const currency = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 });

function calculateExposure(zeekrDamage, zeekrInsurance, porscheDamage, porscheInsurance) {
  const zeekrGap = Math.max(0, zeekrDamage - zeekrInsurance);
  const porscheGap = Math.max(0, porscheDamage - porscheInsurance);
  const damage = zeekrDamage + porscheDamage;
  const insurance = zeekrInsurance + porscheInsurance;

  return { zeekrGap, porscheGap, damage, insurance, gap: zeekrGap + porscheGap };
}

function render() {
  const values = inputs.map(input => Number(input.value));
  const invalid = inputs.map(input => input.value === '' || !input.validity.valid);
  const excessiveInsurance = values[1] > values[0] || values[3] > values[2];

  inputs.forEach((input, index) => {
    const exceedsDamage = index % 2 === 1 && values[index] > values[index - 1];
    input.setAttribute('aria-invalid', String(invalid[index] || exceedsDamage));
  });

  if (invalid.some(Boolean) || excessiveInsurance) {
    error.hidden = false;
    error.textContent = excessiveInsurance
      ? 'В этом расчёте ОСАГО не может превышать ущерб соответствующей машины.'
      : 'Введи целые неотрицательные суммы: ущерб до 10 000 000 ₽, ОСАГО до 400 000 ₽ на каждого потерпевшего.';

    document.getElementById('total-gap').textContent = 'Проверь суммы';
    document.getElementById('gap-detail').textContent = 'Расчёт приостановлен до исправления полей.';
    document.querySelector('.calc-bars').hidden = true;
    return;
  }

  error.hidden = true;
  document.querySelector('.calc-bars').hidden = false;

  const result = calculateExposure(...values);
  const insuranceShare = result.damage === 0 ? 0 : result.insurance / result.damage * 100;

  document.getElementById('total-gap').textContent = currency.format(result.gap);
  document.getElementById('gap-detail').textContent = `Zeekr: ${currency.format(result.zeekrGap)} · Porsche: ${currency.format(result.porscheGap)}`;
  document.getElementById('insurance-total').textContent = currency.format(result.insurance);
  document.getElementById('damage-total').textContent = `Общий ущерб: ${currency.format(result.damage)}`;
  document.getElementById('covered-bar').style.width = `${insuranceShare}%`;
  document.querySelector('.bar').setAttribute('aria-label', `ОСАГО: ${currency.format(result.insurance)}. Разница: ${currency.format(result.gap)}.`);
  document.querySelector('.bar').style.background = result.damage === 0 ? '#d9dcd2' : '';
}

presetButtons.forEach(button => {
  button.addEventListener('click', () => {
    const values = presets[button.dataset.preset];

    inputs.forEach((input, index) => {
      input.value = values[index];
    });
    presetButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));

    render();
  });
});

inputs.forEach(input => {
  input.addEventListener('input', () => {
    presetButtons.forEach(button => button.setAttribute('aria-pressed', 'false'));

    render();
  });
});

document.getElementById('damage-form').addEventListener('submit', event => event.preventDefault());

let expandedBeforePrint = [];

window.addEventListener('beforeprint', () => {
  expandedBeforePrint = [...document.querySelectorAll('details')].filter(detail => !detail.open);

  expandedBeforePrint.forEach(detail => {
    detail.open = true;
  });
});

window.addEventListener('afterprint', () => {
  expandedBeforePrint.forEach(detail => {
    detail.open = false;
  });
});

render();
