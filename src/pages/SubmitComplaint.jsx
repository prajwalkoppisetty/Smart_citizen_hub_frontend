import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { complaintService } from '../services/complaintService';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import EXIF from 'exif-js';
import { ShieldCheck, MapPin, Upload, Trash2, ArrowRight, Camera, Sparkles, Brain, Check, Loader2 } from 'lucide-react';
import { analyzeComplaint } from '../services/aiService';

const convertDMSToDecimal = (dms, ref) => {
  if (!dms || dms.length < 3) return null;
  const degrees = typeof dms[0] === 'object' ? dms[0].numerator / dms[0].denominator : dms[0];
  const minutes = typeof dms[1] === 'object' ? dms[1].numerator / dms[1].denominator : dms[1];
  const seconds = typeof dms[2] === 'object' ? dms[2].numerator / dms[2].denominator : dms[2];
  
  let decimal = degrees + minutes / 60 + seconds / 3600;
  if (ref === "S" || ref === "W") {
    decimal = -decimal;
  }
  return decimal;
};

const isAddressTooGeneric = (addr) => {
  if (!addr) return true;
  const cleanAddr = addr.trim();
  
  // Rule 1: Too short (under 15 characters)
  if (cleanAddr.length < 15) return true;

  // Rule 2: Fewer than 3 words
  const words = cleanAddr.split(/\s+/).filter(w => w.length > 0);
  if (words.length < 3) return true;

  // Rule 3: Check for typical structural details (comma or descriptive indicators)
  const hasDetails = /street|road|st|rd|hno|house|near|opposite|opp|behind|beside|at|junction|landmark|colony|sector|plot|flat|building|ward|floor/i.test(cleanAddr);
  if (!hasDetails && !cleanAddr.includes(',')) {
    return true;
  }
  
  return false;
};

const getGPSCoordinates = (file) => {
  return new Promise((resolve) => {
    try {
      EXIF.getData(file, function() {
        const lat = EXIF.getTag(this, "GPSLatitude");
        const lon = EXIF.getTag(this, "GPSLongitude");
        const latRef = EXIF.getTag(this, "GPSLatitudeRef") || "N";
        const lonRef = EXIF.getTag(this, "GPSLongitudeRef") || "E";
        
        if (lat && lon && lat.length >= 3 && lon.length >= 3) {
          const latDecimal = convertDMSToDecimal(lat, latRef);
          const lonDecimal = convertDMSToDecimal(lon, lonRef);
          resolve({ latitude: latDecimal, longitude: lonDecimal });
        } else {
          resolve(null);
        }
      });
    } catch (err) {
      console.error("Error reading EXIF data:", err);
      resolve(null);
    }
  });
};

const reverseGeocode = async (lat, lon) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'SmartCitizenHub/1.0'
      }
    });
    if (!response.ok) throw new Error("OSM Nominatim API request failed");
    const data = await response.json();
    if (data && data.display_name) {
      return data.display_name;
    }
    return null;
  } catch (err) {
    console.error("Reverse geocoding error:", err);
    return null;
  }
};

export default function SubmitComplaint() {
  const navigate = useNavigate();
  const { addToast } = useNotification();
  
  // States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Road & Infrastructure');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Location extraction states
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locationStatus, setLocationStatus] = useState('none'); // 'none', 'extracting', 'geocoding', 'success_exif', 'failed_exif', 'browser_gps', 'success_browser', 'failed_browser'

  // Refs for Leaflet Map
  const mapContainerRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);
  const markerInstanceRef = React.useRef(null);

  // AI analysis states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);
  const [isAiApplied, setIsAiApplied] = useState(false);

  // Duplicate Check states
  const [duplicateTicket, setDuplicateTicket] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [bypassDuplicate, setBypassDuplicate] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Helper: Convert File to base64 string
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Helper: Map AI suggested category to option dropdown value
  const mapToFormCategory = (aiCategory) => {
    const categories = [
      "Road & Infrastructure",
      "Water & Sanitation",
      "Garbage & Waste",
      "Electricity & Lighting",
      "Others"
    ];
    if (!aiCategory) return "Road & Infrastructure";
    const matched = categories.find(c => 
      c.toLowerCase().trim() === aiCategory.toLowerCase().trim() ||
      aiCategory.toLowerCase().includes(c.toLowerCase()) ||
      c.toLowerCase().includes(aiCategory.toLowerCase())
    );
    if (matched) return matched;
    if (aiCategory.toLowerCase().includes("public health") || aiCategory.toLowerCase().includes("other")) {
      return "Others";
    }
    return "Road & Infrastructure";
  };

  // Trigger AI analysis when an image is selected and description is typed
  useEffect(() => {
    if (selectedFiles.length === 0 || !description || description.trim().length < 10) {
      return;
    }

    const firstFileName = selectedFiles[0].name;
    const descLength = description.trim().length;

    // Debounce the analysis by 1.5 seconds to let the user finish typing
    const timer = setTimeout(async () => {
      if (isAnalyzing) return;

      // Caching: check if we already analyzed this image + description combo
      if (aiAnalysis && aiAnalysis._sourceImage === firstFileName && aiAnalysis._sourceDescLength === descLength) {
        return;
      }

      setIsAnalyzing(true);
      setShowAiSuggestion(false);
      setIsAiApplied(false);
      try {
        const base64Image = await convertToBase64(selectedFiles[0]);
        const analysis = await analyzeComplaint(base64Image, description);
        
        // Add cache markers
        analysis._sourceImage = firstFileName;
        analysis._sourceDescLength = descLength;
        setAiAnalysis(analysis);

        if (analysis.confidence >= 80) {
          const matchedCategory = mapToFormCategory(analysis.category);
          setCategory(matchedCategory);
          if (analysis.severity) {
            setPriority(analysis.severity);
          }
          addToast(`AI Auto-Categorized: ${matchedCategory} (${analysis.confidence}% confidence)`, 'success');
        } else {
          setShowAiSuggestion(true);
          addToast(`AI Suggestion ready: ${analysis.category} (${analysis.confidence}% confidence)`, 'info');
        }
      } catch (err) {
        console.error("Auto AI analysis failed:", err);
      } finally {
        setIsAnalyzing(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [selectedFiles, description]);

  // Reset AI states when images are cleared
  useEffect(() => {
    if (selectedFiles.length === 0) {
      setAiAnalysis(null);
      setShowAiSuggestion(false);
      setIsAiApplied(false);
    }
  }, [selectedFiles]);

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      previews.forEach(p => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  // Handle Forward Geocoding: Look up typed address using Nominatim
  const handleGeocodeAddress = async () => {
    if (!location || location.trim().length < 5) {
      addToast('Please enter a specific address to search.', 'warning');
      return;
    }
    
    setLocationStatus('geocoding');
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`;
      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'SmartCitizenHub/1.0'
        }
      });
      
      if (!response.ok) throw new Error("Nominatim search failed");
      const results = await response.json();
      
      if (results && results.length > 0) {
        const lat = parseFloat(results[0].lat);
        const lon = parseFloat(results[0].lon);
        setLatitude(lat);
        setLongitude(lon);
        setLocationStatus('success_browser');
        addToast('Address located on map! You can drag the pin to adjust.', 'success');
      } else {
        setLocationStatus('failed_browser');
        addToast('Could not find this address on map. Please be more specific.', 'warning');
      }
    } catch (err) {
      console.error("Geocoding error:", err);
      setLocationStatus('failed_browser');
      addToast('Failed to locate address. Please check your network.', 'error');
    }
  };

  // Initialize and update Leaflet Map
  useEffect(() => {
    const L = window.L;
    if (!L) return;

    if (latitude && longitude && mapContainerRef.current) {
      // Create map if it doesn't exist yet
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current).setView([latitude, longitude], 16);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Add a draggable marker
        const marker = L.marker([latitude, longitude], { draggable: true }).addTo(map);

        // On dragging the marker, update coordinates and reverse-geocode
        marker.on('dragend', async () => {
          const position = marker.getLatLng();
          const lat = position.lat;
          const lng = position.lng;
          setLatitude(lat);
          setLongitude(lng);

          setLocationStatus('geocoding');
          const resolvedAddress = await reverseGeocode(lat, lng);
          if (resolvedAddress) {
            setLocation(resolvedAddress);
            setLocationStatus('success_browser');
            addToast('Location pin adjusted, address updated!', 'success');
          } else {
            setLocationStatus('failed_browser');
          }
        });

        mapInstanceRef.current = map;
        markerInstanceRef.current = marker;
      } else {
        // If map already exists, just center it and update marker position
        const map = mapInstanceRef.current;
        const marker = markerInstanceRef.current;
        map.setView([latitude, longitude], 16);
        marker.setLatLng([latitude, longitude]);
      }
    } else {
      // Clean up map if coordinates are removed or container is gone
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
    }
  }, [latitude, longitude]);

  // Clean up Leaflet Map instance on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
    };
  }, []);

  // Image Upload change handler
  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    const newPreviews = [];

    files.forEach(file => {
      if (file.size > 2 * 1024 * 1024) {
        addToast(`File ${file.name} must be under 2MB`, 'warning');
        return;
      }
      
      validFiles.push(file);
      newPreviews.push({
        id: Math.random().toString(36).substring(2, 9),
        file: file,
        url: URL.createObjectURL(file)
      });
    });

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      setPreviews(prev => [...prev, ...newPreviews]);
      addToast(`Selected ${validFiles.length} photo(s)`, 'success');

      // Attempt to extract EXIF from the first file
      const firstFile = validFiles[0];
      setLocationStatus('extracting');
      try {
        const coords = await getGPSCoordinates(firstFile);
        if (coords) {
          setLatitude(coords.latitude);
          setLongitude(coords.longitude);
          setLocationStatus('geocoding');
          
          const resolvedAddress = await reverseGeocode(coords.latitude, coords.longitude);
          if (resolvedAddress) {
            setLocation(resolvedAddress);
            setLocationStatus('success_exif');
            addToast('Address auto-filled from geotagged image!', 'success');
          } else {
            setLocationStatus('failed_exif');
          }
        } else {
          setLocationStatus('failed_exif');
        }
      } catch (err) {
        console.error("GPS EXIF extraction error:", err);
        setLocationStatus('failed_exif');
      }
    }
  };

  const handleClearImage = (idToRemove, fileToRemove) => {
    const nextPreviews = previews.filter(p => p.id !== idToRemove);
    setPreviews(nextPreviews);
    setSelectedFiles(prev => prev.filter(f => f !== fileToRemove));
    addToast('Photo removed', 'info');

    if (nextPreviews.length === 0) {
      setLatitude(null);
      setLongitude(null);
      setLocationStatus('none');
    }
  };

  const handleCameraFileSelected = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      addToast(`File ${file.name} must be under 2MB`, 'warning');
      return;
    }

    // Capture browser GPS at the exact same time
    setLocationStatus('browser_gps');
    
    const newPreview = {
      id: Math.random().toString(36).substring(2, 9),
      file: file,
      url: URL.createObjectURL(file)
    };

    setSelectedFiles(prev => [...prev, file]);
    setPreviews(prev => [...prev, newPreview]);

    // Request browser Geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setLatitude(lat);
          setLongitude(lon);
          
          setLocationStatus('geocoding');
          const resolvedAddress = await reverseGeocode(lat, lon);
          if (resolvedAddress) {
            setLocation(resolvedAddress);
            setLocationStatus('success_browser');
            addToast('Address auto-filled using browser GPS!', 'success');
          } else {
            setLocationStatus('failed_browser');
          }
        },
        (error) => {
          console.error("Browser Geolocation failed:", error);
          setLocationStatus('failed_browser');
          addToast('Could not access device GPS. Please input manually.', 'warning');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setLocationStatus('failed_browser');
      addToast('Browser location API not supported.', 'warning');
    }
  };

  const submitComplaintPayload = async () => {
    try {
      const isHighConfidenceAI = aiAnalysis && aiAnalysis.confidence >= 80;
      const useAI = isHighConfidenceAI || isAiApplied;

      const finalTitle = useAI && aiAnalysis?.title ? aiAnalysis.title : title;
      const finalDescription = useAI && aiAnalysis?.description ? aiAnalysis.description : description;

      const formData = new FormData();
      formData.append('title', finalTitle);
      formData.append('description', finalDescription);
      formData.append('category', category);
      formData.append('priority', priority);
      
      // Serialize location details to match nested backend model
      const locationObj = {
        address: location,
        latitude: latitude,
        longitude: longitude
      };
      formData.append('location', JSON.stringify(locationObj));

      // Append all image files
      selectedFiles.forEach(file => {
        formData.append('images', file);
      });

      if (aiAnalysis) {
        formData.append('aiAnalysis', JSON.stringify({
          title: aiAnalysis.title || '',
          summary: aiAnalysis.summary || '',
          description: aiAnalysis.description || '',
          category: aiAnalysis.category || '',
          severity: aiAnalysis.severity || '',
          confidence: aiAnalysis.confidence || 0
        }));
      }

      // Call API Service
      await complaintService.createComplaint(formData, (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      setIsSubmitting(false);
      addToast('Complaint submitted successfully to Ward Headquarters!', 'success');
      
      // Redirect to Track page
      navigate('/dashboard/track');
    } catch (err) {
      console.error("Failed to submit complaint:", err);
      setIsSubmitting(false);
      setUploadProgress(0);
      addToast(err.userMessage || 'Failed to submit complaint to the backend.', 'error');
    }
  };

  const handleSubscribeToDuplicate = async () => {
    if (!duplicateTicket) return;
    setIsSubscribing(true);
    try {
      await complaintService.subscribeToComplaint(duplicateTicket.id);
      addToast('Successfully upvoted and subscribed to existing complaint! You will receive live status progress alerts.', 'success');
      setShowDuplicateModal(false);
      navigate('/dashboard/track');
    } catch (err) {
      console.error("Failed to subscribe:", err);
      addToast(err.userMessage || 'Failed to register subscription.', 'error');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleBypassSubmit = async () => {
    setShowDuplicateModal(false);
    setBypassDuplicate(true);
    setIsSubmitting(true);
    // Submit complaint immediately
    // Wait for state setting to bypass checking
    setTimeout(() => {
      submitComplaintPayload();
    }, 100);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setUploadProgress(0);

    // Client-side validations
    const tempErrors = {};
    if (!title) tempErrors.title = 'Complaint Title is required';
    if (title.length < 10) tempErrors.title = 'Title must be at least 10 characters';
    if (!description) tempErrors.description = 'Provide a full descriptive explanation';
    if (!location) {
      tempErrors.location = 'Specify the location of the grievance';
    } else if (isAddressTooGeneric(location)) {
      tempErrors.location = 'Address is too generic. Please provide specific landmarks, street, or house details (e.g., "Near MVP Double Road Bus Stop, Sector 3, MVP Colony").';
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      addToast('Please satisfy all grievance validation rules', 'warning');
      return;
    }

    setIsSubmitting(true);

    // Duplicate Check
    if (latitude !== null && longitude !== null && !bypassDuplicate) {
      try {
        const dupRes = await complaintService.checkDuplicate({
          category,
          latitude,
          longitude
        });
        if (dupRes && dupRes.duplicateFound) {
          setDuplicateTicket(dupRes.duplicate);
          setShowDuplicateModal(true);
          setIsSubmitting(false);
          return;
        }
      } catch (err) {
        console.warn("Duplicate check failed, bypassing...", err);
      }
    }
    
    await submitComplaintPayload();
  };

  const renderLocationStatusBanner = () => {
    let classes = "";
    let content = null;
    
    switch (locationStatus) {
      case 'none':
        classes = "bg-slate-50 border-slate-200 text-slate-600";
        content = (
          <p className="text-[11px] font-semibold flex items-center gap-1.5 leading-normal">
            <span className="flex h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
            No image uploaded. Please specify the location address manually.
          </p>
        );
        break;
      case 'extracting':
        classes = "bg-blue-50 border-blue-200 text-blue-700 animate-pulse";
        content = (
          <p className="text-[11px] font-bold flex items-center gap-1.5 leading-normal">
            <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping shrink-0" />
            Reading image metadata for geotags...
          </p>
        );
        break;
      case 'geocoding':
        classes = "bg-blue-50 border-blue-200 text-blue-700";
        content = (
          <p className="text-[11px] font-bold flex items-center gap-1.5 leading-normal">
            <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
            GPS coordinates found: {latitude?.toFixed(4)}, {longitude?.toFixed(4)}. Querying reverse geocoder...
          </p>
        );
        break;
      case 'success_exif':
        classes = "bg-emerald-50 border-emerald-200 text-emerald-700";
        content = (
          <p className="text-[11px] font-bold flex items-center gap-1.5 leading-normal">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            Auto-filled address from photo geotag: ({latitude?.toFixed(4)}, {longitude?.toFixed(4)})
          </p>
        );
        break;
      case 'failed_exif':
        classes = "bg-amber-50 border-amber-200 text-amber-700";
        content = (
          <p className="text-[11px] font-bold flex items-center gap-1.5 leading-normal">
            <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
            GPS metadata not found in uploaded image. Please enter address manually.
          </p>
        );
        break;
      case 'browser_gps':
        classes = "bg-blue-50 border-blue-200 text-blue-700 animate-pulse";
        content = (
          <p className="text-[11px] font-bold flex items-center gap-1.5 leading-normal">
            <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping shrink-0" />
            Acquiring device GPS coordinates...
          </p>
        );
        break;
      case 'success_browser':
        classes = "bg-emerald-50 border-emerald-200 text-emerald-700";
        content = (
          <p className="text-[11px] font-bold flex items-center gap-1.5 leading-normal">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            Auto-filled address using live GPS: ({latitude?.toFixed(4)}, {longitude?.toFixed(4)})
          </p>
        );
        break;
      case 'failed_browser':
        classes = "bg-amber-50 border-amber-200 text-amber-700";
        content = (
          <p className="text-[11px] font-bold flex items-center gap-1.5 leading-normal">
            <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
            Failed to fetch device GPS. Please enter address manually.
          </p>
        );
        break;
      default:
        return null;
    }
    
    return (
      <div className={`p-3 rounded-xl border ${classes} text-left`}>
        {content}
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      
      {/* Page Header */}
      <div className="text-left border-b border-slate-100 pb-5">
        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">Municipal Registry</span>
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 mt-1">
          Grievance Submission Form
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Fill out all sections truthfully. System will route your issue automatically to the division officer.
        </p>
      </div>

      {/* Main split grid */}
      <form onSubmit={handleFormSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Form left */}
        <div className="lg:col-span-8 bg-white border border-slate-100 p-6 sm:p-8 rounded-3xl shadow-sm space-y-5 animate-slide-up">
          
          {/* Title */}
          <Input
            id="title"
            label="Brief Grievance Title"
            type="text"
            placeholder="e.g. Large dangerous pothole near Sector C junction"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
          />

          {/* Description */}
          <div className="flex flex-col space-y-1.5 w-full text-left">
            <label htmlFor="description" className="text-xs font-bold text-slate-700 tracking-wide">
              Detailed Complaint Explanation
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue, size of hazard, impact on community and urgency level..."
              rows={5}
              className={`w-full rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition-all duration-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 ${
                errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : ''
              }`}
            />
            {errors.description && (
              <span className="text-[11px] font-semibold text-red-600 leading-none">
                {errors.description}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Category Dropdown */}
            <div className="flex flex-col space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-700 tracking-wide">
                Grievance Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition-all duration-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="Road & Infrastructure">Road & Infrastructure</option>
                <option value="Water & Sanitation">Water & Sanitation</option>
                <option value="Garbage & Waste">Garbage & Waste</option>
                <option value="Electricity & Lighting">Electricity & Lighting</option>
                <option value="Others">Others / Public Health</option>
              </select>
            </div>

            {/* Priority Selection */}
            <div className="flex flex-col space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-700 tracking-wide">
                Urgency Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition-all duration-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="Low">Low - Informational Notice</option>
                <option value="Medium">Medium - Standard 48h Response</option>
                <option value="High">High - Emergency Level Intervention</option>
              </select>
            </div>

          </div>

          {/* AI Analysis Cards */}
          {isAnalyzing && (
            <div className="bg-blue-50/40 border border-dashed border-blue-100 rounded-2xl p-4 flex items-center space-x-3 text-left animate-pulse">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-bounce" />
                  AI Analysis in Progress...
                </h4>
                <p className="text-[10px] text-blue-700 font-semibold mt-0.5">Gemini 2.5 Flash is analyzing your uploaded photo and description to determine classification and severity.</p>
              </div>
            </div>
          )}

          {aiAnalysis && !isAnalyzing && (aiAnalysis.confidence >= 80 || isAiApplied) && (
            <div className="bg-emerald-50/40 border border-emerald-100/80 rounded-2xl p-4 flex items-start space-x-3 text-left relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-100/50 rounded-bl-xl">
                {aiAnalysis.confidence >= 80 ? "Auto-Applied" : "Applied by User"}
              </div>
              <div className="p-2 bg-emerald-100/50 rounded-xl text-emerald-600 shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-emerald-950 flex items-center">
                  Gemini AI Verified & Categorized
                  <span className="ml-2 px-1.5 py-0.5 text-[9px] font-extrabold bg-emerald-100 text-emerald-700 rounded-md">
                    {aiAnalysis.confidence}% Match
                  </span>
                </h4>
                <div className="text-[10px] text-emerald-800 font-medium space-y-1 mt-1 leading-normal">
                  <p><strong>AI Title:</strong> {aiAnalysis.title}</p>
                  <p><strong>AI Description:</strong> {aiAnalysis.description}</p>
                </div>
                <div className="flex flex-wrap gap-2 pt-1.5">
                  <span className="px-2 py-0.5 text-[9px] font-bold bg-white border border-emerald-100 text-emerald-700 rounded-full">
                    Category: {category}
                  </span>
                  <span className="px-2 py-0.5 text-[9px] font-bold bg-white border border-emerald-100 text-emerald-700 rounded-full">
                    Priority: {priority}
                  </span>
                </div>
              </div>
            </div>
          )}

          {showAiSuggestion && aiAnalysis && !isAnalyzing && !isAiApplied && (
            <div className="bg-amber-50/40 border border-amber-100/80 rounded-2xl p-4 flex items-start space-x-3 text-left relative overflow-hidden">
              <div className="p-2 bg-amber-100/50 rounded-xl text-amber-600 shrink-0">
                <Brain className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1.5">
                <h4 className="text-xs font-bold text-amber-950 flex items-center">
                  AI Suggestion Available
                  <span className="ml-2 px-1.5 py-0.5 text-[9px] font-extrabold bg-amber-100 text-amber-700 rounded-md">
                    {aiAnalysis.confidence}% Confidence
                  </span>
                </h4>
                <div className="text-[10px] text-amber-800 font-medium leading-relaxed space-y-1 mt-1">
                  <p>Gemini suggests categorizing this as <strong>{aiAnalysis.category}</strong> (Severity: <strong>{aiAnalysis.severity}</strong>).</p>
                  <div className="text-[9px] text-slate-500 pl-2 border-l border-amber-200 space-y-0.5">
                    <p><strong>AI Title:</strong> {aiAnalysis.title}</p>
                    <p><strong>AI Description:</strong> {aiAnalysis.description}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const matched = mapToFormCategory(aiAnalysis.category);
                    setCategory(matched);
                    if (aiAnalysis.severity) {
                      setPriority(aiAnalysis.severity);
                    }
                    setIsAiApplied(true);
                    setShowAiSuggestion(false);
                    addToast("AI category, priority, title, and description settings applied!", "success");
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-extrabold shadow-sm transition"
                >
                  Confirm & Apply AI Suggestion
                </button>
              </div>
            </div>
          )}
 
          {/* Location geocoding feedback banner */}
          <div className="mb-4">
            {renderLocationStatusBanner()}
          </div>

          {/* Location input */}
          <div className="flex flex-col space-y-2 text-left">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  id="location"
                  label="Accurate Location Coordinate / Landmarks"
                  type="text"
                  placeholder="e.g. Near MVP Double Road Bus Stop, Sector 3, MVP Colony"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  error={errors.location}
                  leftIcon={<MapPin className="h-4 w-4 text-slate-400" />}
                />
              </div>
              <button
                type="button"
                onClick={handleGeocodeAddress}
                className="h-11 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center shrink-0 gap-1.5 focus:outline-none focus:ring-4 focus:ring-blue-100 border-none shadow-sm"
              >
                <MapPin className="h-4 w-4" />
                Locate on Map
              </button>
            </div>
          </div>

          {/* Leaflet Map Container */}
          {latitude !== null && longitude !== null && (
            <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm transition-all duration-300">
              <div 
                ref={mapContainerRef} 
                className="w-full h-64 z-10"
                style={{ minHeight: '256px' }}
              />
              <div className="absolute bottom-2 left-2 z-[1000] bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[9px] font-semibold text-slate-600 border border-slate-100 shadow-xs pointer-events-none">
                Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-50 flex flex-col justify-end items-end space-y-3">
            {/* Upload Progress Bar */}
            {isSubmitting && uploadProgress > 0 && (
              <div className="w-full max-w-xs space-y-1">
                <div className="flex justify-between text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  <span>Uploading files...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
            
            <Button
              type="submit"
              variant="primary"
              className="px-8 w-full sm:w-auto"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="h-4.5 w-4.5" />}
            >
              Submit Complaint
            </Button>
          </div>

        </div>

        {/* Image Preview Right */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm text-center flex flex-col justify-between h-full space-y-4">
            
            <div className="space-y-2 text-left">
              <h3 className="font-display font-extrabold text-sm text-slate-800">
                Grievance Photo Evidence
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Upload clear high-quality images of the incident path. Evidence helps local field engineers identify and prepare exact maintenance resources.
              </p>
            </div>

            {/* Preview Box */}
            <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[220px] bg-slate-50/50 hover:bg-slate-50 transition-colors group overflow-hidden">
              {previews.length > 0 ? (
                <div className="w-full space-y-3">
                  <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                    {previews.map((p) => (
                      <div key={p.id} className="relative group rounded-xl overflow-hidden border border-slate-100 h-24">
                        <img
                          src={p.url}
                          alt="Evidence preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleClearImage(p.id, p.file)}
                            className="p-1.5 bg-white rounded-lg text-red-600 hover:text-red-700 shadow-md cursor-pointer border-none"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Select more trigger */}
                  <div className="flex gap-2">
                    <label className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 border border-dashed border-slate-200 hover:border-slate-300 rounded-xl bg-white hover:bg-slate-50 cursor-pointer transition text-[11px] font-bold text-slate-600">
                      <Upload className="h-3.5 w-3.5 animate-bounce shrink-0" />
                      <span>Add More</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>

                    <label className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 border border-dashed border-slate-200 hover:border-slate-300 rounded-xl bg-white hover:bg-slate-50 cursor-pointer transition text-[11px] font-bold text-slate-600">
                      <Camera className="h-3.5 w-3.5 shrink-0" />
                      <span>Take Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleCameraFileSelected}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col space-y-3 py-4">
                  <label className="flex flex-col items-center justify-center space-y-2.5 cursor-pointer border border-dashed border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50 p-6 rounded-2xl transition">
                    <div className="h-10 w-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 shadow-sm">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div className="text-center leading-none">
                      <span className="text-xs font-bold text-slate-700">Click to Select Photos</span>
                      <span className="block text-[9px] text-slate-400 mt-1 font-semibold">PNG, JPG up to 2MB (Extracts GPS)</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>

                  <div className="text-xs font-bold text-slate-400 select-none">OR</div>

                  <label className="flex flex-col items-center justify-center space-y-2 cursor-pointer border border-dashed border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50 p-6 rounded-2xl transition">
                    <div className="h-10 w-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                      <Camera className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-center leading-none">
                      <span className="text-xs font-bold text-slate-700">Take Photo (Live Camera)</span>
                      <span className="block text-[9px] text-slate-400 mt-1 font-semibold">Captures device GPS coordinates</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleCameraFileSelected}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-start space-x-2 text-[10px] leading-relaxed text-slate-400 text-left font-semibold shrink-0">
              <ShieldCheck className="h-4.5 w-4.5 text-blue-600 shrink-0" />
              <p>
                All evidence uploads are verified by field officers. Spurious dumps are reported for IP block checks.
              </p>
            </div>

          </div>
        </div>

      </form>

      {/* Duplicate Warning Modal */}
      {duplicateTicket && (
        <Modal
          isOpen={showDuplicateModal}
          onClose={() => setShowDuplicateModal(false)}
          title="Potential Duplicate Grievance Detected"
          footer={
            <div className="flex space-x-2 w-full justify-end pt-2">
              <Button 
                variant="secondary" 
                onClick={() => setShowDuplicateModal(false)}
                disabled={isSubscribing || isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                variant="outline" 
                onClick={handleBypassSubmit}
                isLoading={isSubmitting}
                disabled={isSubscribing}
              >
                Submit Anyway
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSubscribeToDuplicate}
                isLoading={isSubscribing}
                disabled={isSubmitting}
              >
                Upvote & Subscribe
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-left font-sans">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3">
              <span className="text-xl">⚠️</span>
              <div>
                <h4 className="text-xs font-bold text-amber-900">Similar issue active nearby</h4>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed font-semibold">
                  An unresolved grievance of type <strong>{category}</strong> was already reported in this exact vicinity. To prevent spam and help municipal officers focus, you can upvote the existing ticket instead.
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-4.5 space-y-2 shadow-sm">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span>TICKET ID: #{duplicateTicket.id}</span>
                <span>STATUS: {duplicateTicket.status}</span>
              </div>
              <h5 className="text-xs font-bold text-slate-800 leading-snug">{duplicateTicket.title}</h5>
              <p className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                <span>📍</span> {duplicateTicket.location}
              </p>
              <span className="text-[9px] text-slate-400 block font-semibold">Reported on: {duplicateTicket.date}</span>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
