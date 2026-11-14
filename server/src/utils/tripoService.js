/**
 * src/utils/tripoService.js
 * Tripo3D AI Image-to-3D integration for BIODIVERSITY.
 * Takes a biological photograph and produces a true 360° volumetric 3D model (.glb).
 */

/**
 * Uploads an image to Tripo3D and polls until the .glb model is ready.
 * @param {Object} options
 * @param {Buffer} options.imageBuffer - Binary buffer of the image
 * @param {string} options.mimeType - e.g. 'image/jpeg', 'image/png'
 * @param {string} [options.apiKey] - Tripo3D API key (or process.env.TRIPO_API_KEY)
 * @param {Function} [options.onProgress] - Optional progress callback
 * @returns {Promise<Buffer>} GLB model buffer
 */
export async function generateWithTripo3D({
  imageBuffer,
  mimeType = 'image/jpeg',
  apiKey = process.env.TRIPO_API_KEY,
  onProgress = null
}) {
  const key = apiKey || process.env.TRIPO_API_KEY;
  if (!key) {
    throw new Error(
      'Tripo3D API Key is missing. Please provide a Tripo3D API key in the admin settings or server/.env'
    );
  }

  const ext = mimeType.includes('png') ? 'png' : 'jpg';

  // 1. Upload the image file to Tripo3D
  const blob = new Blob([imageBuffer], { type: mimeType });
  const formData = new FormData();
  formData.append('file', blob, `specimen.${ext}`);

  const uploadRes = await fetch('https://api.tripo3d.ai/v2/openapi/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`
    },
    body: formData
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Tripo3D upload failed (${uploadRes.status}): ${errText}`);
  }

  const uploadJson = await uploadRes.json();
  const imageToken = uploadJson.data?.image_token || uploadJson.data?.file_token;
  if (!imageToken) {
    throw new Error(`Tripo3D did not return an image token: ${JSON.stringify(uploadJson)}`);
  }

  // 2. Submit Image-to-3D Generation Task
  const taskRes = await fetch('https://api.tripo3d.ai/v2/openapi/task', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'image_to_model',
      file: {
        type: ext,
        file_token: imageToken
      }
    })
  });

  if (!taskRes.ok) {
    const errText = await taskRes.text();
    throw new Error(`Tripo3D task creation failed (${taskRes.status}): ${errText}`);
  }

  const taskJson = await taskRes.json();
  const taskId = taskJson.data?.task_id;
  if (!taskId) {
    throw new Error(`Tripo3D did not return a task_id: ${JSON.stringify(taskJson)}`);
  }

  // 3. Poll task status until completion (up to ~150 seconds)
  const maxAttempts = 60;
  const pollIntervalMs = 2500;
  let modelUrl = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

    const pollRes = await fetch(`https://api.tripo3d.ai/v2/openapi/task/${taskId}`, {
      headers: {
        Authorization: `Bearer ${key}`
      }
    });

    if (!pollRes.ok) continue;

    const pollJson = await pollRes.json();
    const data = pollJson.data || {};
    const status = (data.status || '').toLowerCase();
    const progress = data.progress || 0;

    if (onProgress) {
      onProgress({ status, progress, attempt });
    }

    if (status === 'success') {
      // Tripo outputs either model, pbr_model, or model_url
      modelUrl = data.output?.model || data.output?.pbr_model || data.output?.model_url;
      break;
    } else if (status === 'failed' || status === 'cancelled') {
      throw new Error(`Tripo3D generation failed: ${data.error || 'Unknown error occurred during 3D generation'}`);
    }
  }

  if (!modelUrl) {
    throw new Error('Tripo3D generation timed out after 150 seconds. Please try again.');
  }

  // 4. Download resulting .glb file
  const modelRes = await fetch(modelUrl);
  if (!modelRes.ok) {
    throw new Error(`Failed to download generated .glb model from Tripo3D (${modelRes.status})`);
  }

  const arrayBuffer = await modelRes.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

