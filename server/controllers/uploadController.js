export async function uploadSingleImage(req, res) {
  if (!req.file || !req.file.path) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  return res.json({ url: req.file.path, public_id: req.file.filename });
}

export async function uploadSingleAudio(req, res) {
  if (!req.file || !req.file.path) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  return res.json({ url: req.file.path, public_id: req.file.filename });
}

export async function uploadSingleVideo(req, res) {
  if (!req.file || !req.file.path) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  return res.json({ url: req.file.path, public_id: req.file.filename });
}
