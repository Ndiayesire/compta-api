(function () {
  function escapeHtml(value) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function highlightJson(jsonText) {
    const escaped = escapeHtml(jsonText);
    return escaped.replace(
      /("(\\u[\dA-Fa-f]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = 'tok-num';
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? 'tok-key' : 'tok-str';
        } else if (/true|false/.test(match)) {
          cls = 'tok-bool';
        } else if (match === 'null') {
          cls = 'tok-null';
        }
        return `<span class="${cls}">${match}</span>`;
      },
    );
  }

  function highlightHttpLine(line) {
    const methodMatch = line.match(/^(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)(\s+.*)$/);
    if (methodMatch) {
      return `<span class="tok-method">${methodMatch[1]}</span><span class="tok-path">${escapeHtml(methodMatch[2])}</span>`;
    }

    const headerMatch = line.match(/^([A-Za-z0-9-]+)(\s*:\s*)(.*)$/);
    if (headerMatch) {
      return `<span class="tok-header">${escapeHtml(headerMatch[1])}</span>${escapeHtml(headerMatch[2])}<span class="tok-header-val">${escapeHtml(headerMatch[3])}</span>`;
    }

    return escapeHtml(line);
  }

  function highlightBlock(text) {
    const trimmed = text.replace(/\r\n/g, '\n').trimEnd();
    const lines = trimmed.split('\n');
    const jsonStart = lines.findIndex((line, index) => {
      if (index === 0) return false;
      return lines[index - 1].trim() === '' && line.trim().startsWith('{');
    });

    if (jsonStart > 0) {
      const httpLines = lines.slice(0, jsonStart).map(highlightHttpLine).join('\n');
      const jsonLines = highlightJson(lines.slice(jsonStart).join('\n'));
      return `${httpLines}\n${jsonLines}`;
    }

    if (/^(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s/.test(lines[0])) {
      return lines.map(highlightHttpLine).join('\n');
    }

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      return highlightJson(trimmed);
    }

    return escapeHtml(trimmed);
  }

  function highlightCodeBlocks() {
    document.querySelectorAll('.content-wrap pre > code').forEach((codeEl) => {
      if (codeEl.dataset.highlighted === '1') return;
      const source = codeEl.textContent || '';
      codeEl.innerHTML = highlightBlock(source);
      codeEl.dataset.highlighted = '1';
      codeEl.closest('pre')?.classList.add('code-block--highlighted');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', highlightCodeBlocks);
  } else {
    highlightCodeBlocks();
  }
})();
