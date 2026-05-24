

serve:
	node scripts/build-site.js && cd dist && python3 -m http.server 1314
