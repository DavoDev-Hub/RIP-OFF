import React, { useState, useRef, useEffect } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
  getDocs,
  query,
  where,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";

import { db } from "../firebase"; // Asegúrate de que el import esté correcto
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/Avatar";
import { ScrollArea } from "../components/ui/ScrollArea";

import {
  Home,
  Search,
  Heart,
  PlusCircle,
  ListPlus,
  SkipBack,
  Play,
  SkipForward,
  Repeat,
  Shuffle,
  Pause,
  Volume,
  Trash,
  Plus,
  Check,
  Edit2,
  X,
} from "lucide-react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { motion } from "framer-motion";
import { Link } from "react-router-dom"; // Import from react-router-dom
export default function MusicStreamingApp() {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [volume, setVolume] = useState(100);
  const [duration, setDuration] = useState(0);
  const [isShuffleOn, setIsShuffleOn] = useState(false);
  const [isRepeatOn, setIsRepeatOn] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [playlists, setPlaylists] = useState([
    { name: "Tus Me Gusta", image: "", songs: [] },
  ]);
  const [likedSongs, setLikedSongs] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState("Tus Me Gusta");
  const [isRenaming, setIsRenaming] = useState(null);
  const [renameInput, setRenameInput] = useState("");
  const [showCreateEditPlaylistPopup, setShowCreateEditPlaylistPopup] =
    useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistImage, setNewPlaylistImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [playlistToEdit, setPlaylistToEdit] = useState(null);
  const [showAddToPlaylistPopup, setShowAddToPlaylistPopup] = useState(false);
  const [songToAdd, setSongToAdd] = useState(null);
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const [showPlansPopup, setShowPlansPopup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword1, setShowPassword1] = useState(false);
  const [allSongs, setAllSongs] = useState([]); // Inicializa vacío para recibir los datos de Firebase
  const [displayedSongs, setDisplayedSongs] = useState([]);
  const [queue, setQueue] = useState([]);
  const audioRef = useRef(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      console.error("User ID no encontrado en localStorage");
    }
  }, []);

  // Escuchar cambios en tiempo real en la colección de "songs" en Firebase
  useEffect(() => {
    const fetchSongsWithCovers = async () => {
      try {
        const songsSnapshot = await getDocs(collection(db, "songs"));
        const songsData = await Promise.all(
          songsSnapshot.docs.map(async (songDoc) => {
            // Cambié `doc` a `songDoc` para evitar confusión con la función `doc`.
            const songData = songDoc.data();
            const coverUrl = await fetchAlbumCover(songData.albumid);

            // Obtiene el nombre del artista usando el artistID
            const artistRef = doc(db, "artists", songData.artistid); // Cambié a `artistRef`
            const artistDoc = await getDoc(artistRef);
            const artistName = artistDoc.exists()
              ? artistDoc.data().name
              : "Desconocido";

            return {
              id: songDoc.id,
              ...songData,
              coverUrl: coverUrl,
              artist: artistName, // Asocia el nombre del artista a la canción
            };
          })
        );
        setAllSongs(songsData);
        setDisplayedSongs(songsData); // Muestra las canciones con sus portadas y nombres de artistas
      } catch (error) {
        console.error("Error fetching songs with covers:", error);
      }
    };

    fetchSongsWithCovers();
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    // Configura la consulta para obtener la playlist "Tus Me Gusta" en tiempo real
    const likedPlaylistQuery = query(
      collection(db, "playlists"),
      where("user_id", "==", userId),
      where("name", "==", "Tus Me Gusta")
    );

    // Configura el listener de Firebase
    const unsubscribe = onSnapshot(likedPlaylistQuery, async (snapshot) => {
      if (!snapshot.empty) {
        const likedPlaylistDoc = snapshot.docs[0];
        const songIds = likedPlaylistDoc.data().songs || [];

        // Obtiene los datos de las canciones a partir de sus IDs
        const likedSongsData = await Promise.all(
          songIds.map(async (songId) => {
            const songDoc = await getDoc(doc(db, "songs", songId));
            return songDoc.exists()
              ? { id: songDoc.id, ...songDoc.data() }
              : null;
          })
        );

        // Filtra posibles resultados nulos y actualiza `likedSongs`
        setLikedSongs(likedSongsData.filter((song) => song !== null));
      } else {
        // Si no existe la playlist "Tus Me Gusta", limpia `likedSongs`
        setLikedSongs([]);
      }
    });

    // Cleanup para el listener de Firebase
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedPlaylist === "Tus Me Gusta") {
      showLikedSongs();
    }
  }, [likedSongs, selectedPlaylist]);

  useEffect(() => {
    if (selectedPlaylist === "Tus Me Gusta") {
      setDisplayedSongs([...likedSongs]); // Asegura que displayedSongs muestre likedSongs
    }
  }, [likedSongs, selectedPlaylist]);

  // Función para mostrar todas las canciones
  const showAllSongs = () => {
    setDisplayedSongs(allSongs);
  };

  const showPlaylistSongs = (playlistName) => {
    const playlist = playlists.find((pl) => pl.name === playlistName);

    if (playlist) {
      // Verifica que `playlist.songs` es un array antes de mapear
      const playlistSongs = Array.isArray(playlist.songs) ? playlist.songs : [];

      setDisplayedSongs(
        playlistSongs.map((songId) => {
          const song = allSongs.find((s) => s.id === songId);
          return (
            song || {
              id: songId,
              title: "Canción no encontrada",
              artist: "Desconocido",
            }
          );
        })
      );
    } else {
      console.warn(`Playlist '${playlistName}' no encontrada.`);
      setDisplayedSongs([]);
    }
  };
  const filteredDisplayedSongs = displayedSongs.filter(
    (song) =>
      song &&
      song.title &&
      song.artist &&
      (song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddToQueue = (song) => {
    // Verifica que la canción no esté ya en la cola
    if (!queue.some((s) => s.id === song.id)) {
      const wasPlaying = isPlaying; // Guarda el estado de reproducción actual
      const currentTime = audioRef.current.currentTime; // Guarda el tiempo actual de reproducción

      setQueue((prevQueue) => {
        const updatedQueue = [...prevQueue, song];
        return updatedQueue;
      });

      // Restaura el tiempo y el estado de reproducción si ya estaba en reproducción
      setTimeout(() => {
        audioRef.current.currentTime = currentTime; // Restaura el tiempo de reproducción
        if (wasPlaying) {
          audioRef.current.play().catch((error) => {
            console.error("Error al continuar la reproducción:", error);
          });
        }
      }, 0);
    }
  };
  // Guardar el estado del queue en localStorage cada vez que cambia
  useEffect(() => {
    localStorage.setItem("queue", JSON.stringify(queue));
  }, [queue]);
  useEffect(() => {
    if (userId) {
      const updateQueueInFirestore = async () => {
        const queueRef = doc(db, "queues", userId);
        await setDoc(queueRef, {
          user_id: userId,
          song_order: queue.map((song) => song.id),
        });
      };
      updateQueueInFirestore();
    }
  }, [queue, userId]);

  // Cargar la cola de reproducción desde localStorage o Firestore al iniciar
  // Cargar la cola de reproducción desde localStorage o Firestore al iniciar
  useEffect(() => {
    const storedQueue = JSON.parse(localStorage.getItem("queue"));
    if (storedQueue) {
      setQueue(storedQueue);
    } else if (userId) {
      const loadQueueFromFirestore = async () => {
        const queueRef = doc(db, "queues", userId);
        const queueDoc = await getDoc(queueRef);
        if (queueDoc.exists()) {
          const songIds = queueDoc.data().song_order;
          const queueData = await Promise.all(
            songIds.map(async (songId) => {
              const songDoc = await getDoc(doc(db, "songs", songId));
              return songDoc.exists()
                ? { id: songDoc.id, ...songDoc.data() }
                : null;
            })
          );
          setQueue(queueData.filter((song) => song !== null)); // Eliminar canciones no válidas
        }
      };
      loadQueueFromFirestore();
    }
  }, [userId]);
  useEffect(() => {
    localStorage.setItem("queue", JSON.stringify(queue));
    if (userId) {
      const updateQueueInFirestore = async () => {
        const queueRef = doc(db, "queues", userId);
        await setDoc(queueRef, {
          user_id: userId,
          song_order: queue.map((song) => song.id),
        });
      };
      updateQueueInFirestore();
    }
  }, [queue, userId]);
  // Recuperar currentTrack de localStorage al cargar la aplicación
  useEffect(() => {
    const storedCurrentTrack = localStorage.getItem("currentTrack");
    if (storedCurrentTrack) {
      setCurrentTrack(JSON.parse(storedCurrentTrack));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("likedSongs", JSON.stringify(likedSongs));
  }, [likedSongs]);

  useEffect(() => {
    const storedLikedSongs = JSON.parse(localStorage.getItem("likedSongs"));
    if (storedLikedSongs) {
      setLikedSongs(storedLikedSongs); // Cargar las canciones desde localStorage al inicio
    }
  }, []);
  useEffect(() => {
    if (!userId) return;

    const fetchLikedSongs = async () => {
      try {
        const likesRef = doc(db, "likes", userId);
        const likesDoc = await getDoc(likesRef);

        if (likesDoc.exists()) {
          const songIds = likesDoc.data().songs;
          const likedSongsData = await Promise.all(
            songIds.map(async (songId) => {
              const songDoc = await getDoc(doc(db, "songs", songId));
              return songDoc.exists()
                ? { id: songDoc.id, ...songDoc.data() }
                : null;
            })
          );
          setLikedSongs(likedSongsData.filter((song) => song !== null));
        } else {
          setLikedSongs([]);
        }
      } catch (error) {
        console.error("Error fetching liked songs:", error);
      }
    };

    fetchLikedSongs();

    const likesRef = doc(db, "likes", userId);
    const unsubscribe = onSnapshot(likesRef, async (likesSnapshot) => {
      if (likesSnapshot.exists()) {
        const songIds = likesSnapshot.data().songs;
        const likedSongsData = await Promise.all(
          songIds.map(async (songId) => {
            const songDoc = await getDoc(doc(db, "songs", songId));
            return songDoc.exists()
              ? { id: songDoc.id, ...songDoc.data() }
              : null;
          })
        );
        setLikedSongs(likedSongsData.filter((song) => song !== null));
      } else {
        setLikedSongs([]);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  const handleAddSongToPlaylist = (playlistName) => {
    if (songToAdd) {
      addSongToPlaylist(playlistName, songToAdd);
      setShowAddToPlaylistPopup(false);
    }
  };

  useEffect(() => {
    setDisplayedSongs(allSongs); // Actualiza después de definir `allSongs`
  }, [allSongs]);

  const openCreateEditPlaylistPopup = (isEditing = false, playlist = null) => {
    setIsEditing(isEditing);
    if (isEditing && playlist) {
      setNewPlaylistName(playlist.name);
      setNewPlaylistImage(playlist.image);
      setPlaylistToEdit(playlist);
    } else {
      setNewPlaylistName("");
      setNewPlaylistImage(null);
      setPlaylistToEdit(null);
    }
    setShowCreateEditPlaylistPopup(true);
  };

  const handleNewPlaylistImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPlaylistImage(URL.createObjectURL(file));
    }
  };

  const closeCreateEditPlaylistPopup = () => {
    setShowCreateEditPlaylistPopup(false);
    setNewPlaylistName("");
    setNewPlaylistImage(null);
    setPlaylistToEdit(null);
  };
  const createOrUpdatePlaylist = async () => {
    const userId = localStorage.getItem("userId"); // Obtén el userId real desde localStorage
    if (!userId) {
      console.error("User ID no encontrado en localStorage");
      return;
    }

    if (isEditing && playlistToEdit) {
      // Actualizar playlist existente
      const playlistRef = doc(db, "playlists", playlistToEdit.id);
      await updateDoc(playlistRef, {
        name: newPlaylistName,
        image: newPlaylistImage || playlistToEdit.image,
      });

      // Actualiza el estado local
      setPlaylists((prevPlaylists) =>
        prevPlaylists.map((playlist) =>
          playlist.id === playlistToEdit.id
            ? { ...playlist, name: newPlaylistName, image: newPlaylistImage }
            : playlist
        )
      );
    } else {
      // Crear nueva playlist
      const newPlaylistId = await createPlaylistInFirestore(
        userId,
        newPlaylistName
      );

      // Agregar la nueva playlist al estado local
      setPlaylists([
        ...playlists,
        {
          id: newPlaylistId,
          name: newPlaylistName,
          image: newPlaylistImage,
          songs: [],
        },
      ]);
    }
    closeCreateEditPlaylistPopup();
  };

  const openAddToPlaylistPopup = (song) => {
    setSongToAdd(song);
    setShowAddToPlaylistPopup(true);
  };

  const closeAddToPlaylistPopup = () => {
    setShowAddToPlaylistPopup(false);
    setSongToAdd(null);
  };

  const addSongToPlaylist = async (playlistName, song) => {
    const playlist = playlists.find((pl) => pl.name === playlistName);
    if (playlist) {
      await addSongToPlaylistInFirestore(playlist.id, song.id);
      setPlaylists((prevPlaylists) => {
        return prevPlaylists.map((pl) => {
          if (
            pl.name === playlistName &&
            !pl.songs.some((s) => s.id === song.id)
          ) {
            return { ...pl, songs: [...pl.songs, song] };
          }
          return pl;
        });
      });
    }
  };
  useEffect(() => {
    const loadPlaylistsAndLikedSongs = () => {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      const playlistsRef = query(
        collection(db, "playlists"),
        where("user_id", "==", userId)
      );
      const unsubscribe = onSnapshot(playlistsRef, async (snapshot) => {
        const playlistsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPlaylists(playlistsData);

        const likedPlaylist = playlistsData.find(
          (pl) => pl.name === "Tus Me Gusta"
        );
        if (likedPlaylist) {
          const likedSongsData = await Promise.all(
            likedPlaylist.songs.map(async (songId) => {
              const songDoc = await getDoc(doc(db, "songs", songId));
              return { id: songDoc.id, ...songDoc.data() };
            })
          );
          setLikedSongs(likedSongsData);
          setDisplayedSongs(likedSongsData); // Asegura que las canciones de "Tus Me Gusta" se muestren en la interfaz
        }
      });

      return () => unsubscribe();
    };

    loadPlaylistsAndLikedSongs();
  }, []);

  async function createOrAddToLikedSongs(userId, songId) {
    if (!userId) return;

    const playlistsRef = collection(db, "playlists");
    const q = query(
      playlistsRef,
      where("user_id", "==", userId),
      where("name", "==", "Tus Me Gusta")
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // Crea la playlist "Tus Me Gusta" si no existe
      await addDoc(playlistsRef, {
        user_id: userId,
        name: "Tus Me Gusta",
        songs: [songId],
      });
    } else {
      // Agrega la canción a la playlist existente
      const playlistId = querySnapshot.docs[0].id;
      await updateDoc(doc(db, "playlists", playlistId), {
        songs: arrayUnion(songId),
      });
    }
  }
  useEffect(() => {
    localStorage.setItem("likedSongs", JSON.stringify(likedSongs));
  }, [likedSongs]);

  useEffect(() => {
    const loadLikedSongs = async () => {
      if (!userId) return; // Verifica que el userId esté listo

      // Carga primero de `localStorage`
      const storedLikedSongs = JSON.parse(localStorage.getItem("likedSongs"));
      if (storedLikedSongs) {
        setLikedSongs(storedLikedSongs);
        setDisplayedSongs(storedLikedSongs);
        return; // Evita cargar de Firebase si los datos ya están en `localStorage`
      }

      // Si no hay datos en `localStorage`, carga desde Firebase
      const likesRef = doc(db, "likes", userId);
      const likesDoc = await getDoc(likesRef);

      if (likesDoc.exists()) {
        const songIds = likesDoc.data().songs;
        const likedSongsData = await Promise.all(
          songIds.map(async (songId) => {
            const songDoc = await getDoc(doc(db, "songs", songId));
            return songDoc.exists()
              ? { id: songDoc.id, ...songDoc.data() }
              : null;
          })
        );

        const filteredLikedSongs = likedSongsData.filter(
          (song) => song !== null
        );
        setLikedSongs(filteredLikedSongs);
        setDisplayedSongs(filteredLikedSongs);

        // Guarda en `localStorage` para la próxima carga
        localStorage.setItem("likedSongs", JSON.stringify(filteredLikedSongs));
      } else {
        setLikedSongs([]);
        setDisplayedSongs([]);
      }
    };

    loadLikedSongs();
  }, [userId]);

  // Función para mostrar solo las canciones a las que el usuario les ha dado "Me gusta"
  const showLikedSongs = () => {
    setDisplayedSongs(
      likedSongs.map((likedSong) => {
        // Encuentra los detalles de la canción en `allSongs`
        const song = allSongs.find(
          (s) => s.id === likedSong.id || s.id === likedSong
        );

        return (
          song || {
            id: likedSong.id || likedSong,
            title: "Canción no encontrada",
            artist: "Desconocido",
            coverUrl: "URL_DE_PLACEHOLDER",
          }
        );
      })
    );
  };

  const toggleLikeSong = async (song) => {
    if (!userId) return;

    const likesRef = doc(db, "likes", userId);
    const likesDoc = await getDoc(likesRef);

    let updatedLikedSongs;

    if (likesDoc.exists()) {
      const isLiked = likesDoc.data().songs.includes(song.id);
      if (isLiked) {
        await updateDoc(likesRef, { songs: arrayRemove(song.id) });
        updatedLikedSongs = likedSongs.filter((liked) => liked.id !== song.id);
      } else {
        await updateDoc(likesRef, { songs: arrayUnion(song.id) });
        updatedLikedSongs = [...likedSongs, song];
      }
    } else {
      await setDoc(likesRef, { songs: [song.id] });
      updatedLikedSongs = [...likedSongs, song];
    }

    setLikedSongs(updatedLikedSongs);
    localStorage.setItem("likedSongs", JSON.stringify(updatedLikedSongs));

    // Mantén `displayedSongs` igual si no estamos en la lista de "Tus Me Gusta".
    if (selectedPlaylist !== "Tus Me Gusta") {
      setDisplayedSongs(allSongs);
      console.log("Manteniendo displayedSongs en Inicio", displayedSongs);
    }
  };

  const selectPlaylistForQueue = (playlistName) => {
    const playlist = playlists.find((pl) => pl.name === playlistName);
    if (playlist) {
      setQueue(playlist.songs);
      setSelectedPlaylist(playlistName);
    }
  };
  async function updateQueueInFirestore(userId, queue) {
    const queueRef = doc(db, "queues", userId);

    try {
      await setDoc(queueRef, {
        user_id: userId,
        song_order: queue.map((song) => song.id),
      });
      console.log("Cola de reproducción actualizada");
    } catch (error) {
      console.error("Error al actualizar la cola de reproducción:", error);
    }
  }
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    updateQueueInFirestore(userId, queue);
  }, [queue]);

  const addSongToQueue = (song) => {
    if (!queue.some((s) => s.id === song.id)) {
      setQueue([...queue, song]);
    }
  };

  // Función para eliminar una playlist en Firestore y en la UI
  const deletePlaylist = async (playlistId, playlistName) => {
    if (playlistName !== "Tus Me Gusta") {
      try {
        // Elimina la playlist en Firestore
        await deleteDoc(doc(db, "playlists", playlistId));

        // Elimina la playlist en la UI
        setPlaylists((prevPlaylists) =>
          prevPlaylists.filter((pl) => pl.id !== playlistId)
        );

        console.log("Playlist eliminada correctamente de Firestore");
      } catch (error) {
        console.error("Error al eliminar la playlist:", error);
      }
    }
  };

  const moveSong = (dragIndex, hoverIndex) => {
    const updatedQueue = [...queue];
    const [draggedSong] = updatedQueue.splice(dragIndex, 1);
    updatedQueue.splice(hoverIndex, 0, draggedSong);
    setQueue(updatedQueue);
  };

  const deleteSong = (index) => {
    const isCurrentTrack = index === currentTrack; // Verifica si la canción eliminada es la actual
    const wasPlaying = isPlaying; // Guarda el estado de reproducción
    const currentTime = audioRef.current.currentTime; // Guarda el tiempo actual de reproducción

    // Actualiza la cola eliminando la canción en la posición especificada
    setQueue((prevQueue) => prevQueue.filter((_, i) => i !== index));

    // Si la canción eliminada es la actual, ajusta el índice de reproducción
    if (isCurrentTrack) {
      setCurrentTrack((prevTrack) =>
        prevTrack >= queue.length - 1 ? 0 : prevTrack
      );
    } else if (index < currentTrack) {
      setCurrentTrack((prevTrack) => prevTrack - 1); // Ajusta el índice si la canción eliminada estaba antes de la actual
    }

    // Después de actualizar la cola, restaura el tiempo y el estado de reproducción
    setTimeout(() => {
      audioRef.current.currentTime = currentTime; // Restaura el tiempo
      if (wasPlaying) {
        audioRef.current.play().catch((error) => {
          console.error("Error al continuar la reproducción:", error);
        });
      }
    }, 0);
  };

  const fetchSongs = async () => {
    const querySnapshot = await getDocs(collection(db, "songs"));
    const songsData = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setAllSongs(songsData);
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  const SongItem = ({ song, index, moveSong, deleteSong }) => {
    const ref = useRef(null);
    const [, drop] = useDrop({
      accept: "song",
      hover(item) {
        if (!ref.current) return;
        const dragIndex = item.index;
        const hoverIndex = index;
        if (dragIndex === hoverIndex) return;
        moveSong(dragIndex, hoverIndex);
        item.index = hoverIndex;
      },
    });
    const [, drag] = useDrag({
      type: "song",
      item: { index },
    });
    drag(drop(ref));
    return (
      <div
        ref={ref}
        className="flex items-center justify-between py-2 px-3 hover:bg-[#282828] rounded"
      >
        <div className="flex items-center">
          <img
            src={song.coverUrl || "URL_DE_PLACEHOLDER"}
            alt={`Cover ${song.title}`}
            className="w-12 h-12 rounded-lg mr-4"
          />

          <div>
            <p className="font-primaryCircular">{song.title}</p>
            <p className="text-sm text-gray-400">{song.artist}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => deleteSong(index)}>
          <Trash className="h-5 w-5 text-red-500" />
        </Button>
      </div>
    );
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    audio.currentTime = e.target.value;
    setCurrentTime(audio.currentTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value;
    setVolume(newVolume);
    audioRef.current.volume = newVolume / 100;
  };

  useEffect(() => {
    const audio = audioRef.current;
    const handleLoadedMetadata = () => setDuration(audio.duration);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, []);

  // Estado para almacenar la cola mezclada y la cola original
  const [shuffledQueue, setShuffledQueue] = useState([]);
  const [originalQueue, setOriginalQueue] = useState([]);

  const shuffleQueue = () => {
    const shuffled = [...queue].sort(() => Math.random() - 0.5); // Mezcla la cola actual
    setShuffledQueue(shuffled);
    setCurrentTrack(0); // Reinicia al inicio de la cola mezclada
  };

  useEffect(() => {
    if (isShuffleOn) {
      // Si se activa el shuffle, guarda la cola original y mezcla
      setOriginalQueue(queue);
      shuffleQueue();
    } else {
      // Si se desactiva, restaura la cola original
      setQueue(originalQueue);
      setCurrentTrack(0); // Reinicia al inicio de la cola original
    }
  }, [isShuffleOn]);

  useEffect(() => {
    const audio = audioRef.current;

    const handleTrackEnd = () => {
      if (isRepeatOn) {
        // Repite la canción actual si `isRepeatOn` está activado
        audio.currentTime = 0;
        audio.play();
      } else if (isShuffleOn) {
        // Avanza a la siguiente canción en la cola mezclada
        setCurrentTrack((prevTrack) => (prevTrack + 1) % shuffledQueue.length);
      } else {
        // Avanza secuencialmente en la cola normal
        setCurrentTrack((prevTrack) => (prevTrack + 1) % queue.length);
      }
    };

    audio.addEventListener("ended", handleTrackEnd);

    return () => {
      audio.removeEventListener("ended", handleTrackEnd);
    };
  }, [queue, shuffledQueue, isShuffleOn, isRepeatOn]);

  // Efecto para manejar el avance automático al siguiente track
  useEffect(() => {
    const audio = audioRef.current;

    // Función para avanzar al siguiente track
    const handleTrackEnd = () => {
      if (isRepeatOn) {
        // Si está activada la repetición, vuelve a reproducir el mismo track
        audio.currentTime = 0;
        audio.play();
      } else {
        // De lo contrario, avanza al siguiente track en la cola
        setCurrentTrack((prevTrack) => (prevTrack + 1) % queue.length);
      }
    };

    // Agrega el listener para el evento 'ended'
    audio.addEventListener("ended", handleTrackEnd);

    // Cleanup: Elimina el listener cuando se desmonta el componente
    return () => {
      audio.removeEventListener("ended", handleTrackEnd);
    };
  }, [queue, isRepeatOn]); // Se ejecuta cuando cambia la cola o el estado de repetición

  // Otros efectos de reproducción de audio
  useEffect(() => {
    const audio = audioRef.current;
    if (queue[currentTrack]?.gcsurl) {
      audio.src = queue[currentTrack].gcsurl;
    }
  }, [currentTrack, queue]);

  useEffect(() => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.play().catch((error) => {
        console.error("Error al iniciar la reproducción:", error);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (isPlaying && audio.src) {
      // Verifica que `src` esté presente
      audio.play().catch((error) => {
        console.error("Error al reproducir el audio:", error);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack, queue]);

  // Cambia el `src` del audio solo cuando cambia `currentTrack`
  useEffect(() => {
    const audio = audioRef.current;
    if (queue.length > 0 && queue[currentTrack]?.src) {
      audio.src = queue[currentTrack].src;
      if (isPlaying) {
        audio.play().catch((error) => {
          console.error("Error al continuar la reproducción:", error);
        });
      }
    }
  }, [currentTrack, queue]);

  useEffect(() => {
    const audio = audioRef.current;
    if (queue.length > 0 && queue[currentTrack]?.gcsurl) {
      audio.src = queue[currentTrack].gcsurl; // Solo cambia la fuente de audio
    }
  }, [currentTrack, queue]); // Solo se ejecuta cuando cambia currentTrack o queue

  useEffect(() => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.play().catch((error) => {
        console.error("Error al iniciar la reproducción:", error);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying]); // Solo se ejecuta cuando cambia isPlaying

  useEffect(() => {
    if (queue.length > 0 && isPlaying) {
      audioRef.current.play().catch((error) => {
        console.error("Error al continuar la reproducción:", error);
      });
    }
  }, [queue]);

  const toggleSettingsPopup = () => {
    setShowSettingsPopup(!showSettingsPopup);
  };

  const togglePasswordPopup = () => {
    setShowPasswordPopup(!showPasswordPopup);
  };

  const togglePlansPopup = () => {
    setShowPlansPopup(!showPlansPopup);
  };

  const handlePlaySong = (song) => {
    const songIndex = queue.findIndex((s) => s.id === song.id);

    if (songIndex === -1) {
      // Si la canción no está en la cola, la agrega al final
      setQueue((prevQueue) => [...prevQueue, song]);
      setCurrentTrack(queue.length); // La reproduce como la última canción
    } else {
      // Si ya está en la cola, simplemente la selecciona
      setCurrentTrack(songIndex);
    }

    setIsPlaying(true); // Inicia la reproducción
  };

  // Pausar manualmente y actualizar el estado
  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Controla la actualización del tiempo actual
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Controla el cambio en `isPlaying`
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.play().catch((error) => {
          console.error("Error al iniciar la reproducción:", error);
        });
      } else {
        audio.pause();
      }
    }
  }, [isPlaying]);

  // Asegura que la fuente de audio solo se ajuste cuando cambie el track
  useEffect(() => {
    if (queue[currentTrack]?.src) {
      audioRef.current.src = queue[currentTrack].src;
    }
  }, [currentTrack, queue]);

  // Cambia de pista y reinicia el tiempo
  const handleNextTrack = () => {
    setCurrentTrack((prevTrack) => (prevTrack + 1) % queue.length);
    setCurrentTime(0);
  };

  const fetchAlbumCover = async (albumId) => {
    try {
      const albumDoc = await getDoc(doc(db, "albums", albumId));
      if (albumDoc.exists()) {
        return albumDoc.data().coverUrl;
      }
    } catch (error) {
      console.error("Error fetching album cover:", error);
    }
    return "URL_DE_PLACEHOLDER"; // URL de imagen placeholder si no se encuentra la portada
  };

  async function createPlaylistInFirestore(userId, name) {
    try {
      const playlistRef = await addDoc(collection(db, "playlists"), {
        user_id: userId,
        name: name,
        songs: [],
      });
      console.log("Playlist creada con ID:", playlistRef.id);
      return playlistRef.id;
    } catch (error) {
      console.error("Error al crear la playlist en Firestore:", error);
    }
  }

  async function addSongToPlaylistInFirestore(playlistId, songId) {
    const playlistRef = doc(db, "playlists", playlistId);

    try {
      await updateDoc(playlistRef, {
        songs: arrayUnion(songId),
      });
      console.log("Canción añadida a la playlist");
    } catch (error) {
      console.error("Error al añadir canción a la playlist:", error);
    }
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="font-primaryCircular flex h-screen bg-[#121212] text-white">
        <aside className="w-60 bg-black flex flex-col">
          <motion.div
            className="p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h1 className="text-2xl font-bold font-bold font-primaryCircular text-[#ED1C24] ">
              Rip-Off Music
            </h1>
          </motion.div>
          <nav className="font-primaryCircular flex-1 overflow-y-auto">
            <ul className="space-y-2 px-2">
              <motion.li
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              ></motion.li>
              <motion.li
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-start"
                  onClick={showAllSongs}
                >
                  <Home className="mr-2 h-4 w-4" />
                  <span>Inicio</span>
                </Button>
              </motion.li>

              <motion.li
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-start"
                  onClick={() => {
                    showLikedSongs(); // Llama a showLikedSongs al hacer clic en "Me Gusta"
                  }}
                >
                  <Heart className="mr-2 h-4 w-4" />
                  <span>Me Gusta</span>
                </Button>
              </motion.li>
            </ul>

            <div className="px-4 mt-4">
              <h3 className="font-primaryCircular text-xs uppercase text-gray-400 mb-2">
                Listas de Reproducción
              </h3>
              <ul className="space-y-2">
                {playlists
                  .filter((playlist) => playlist.name !== "Tus Me Gusta")
                  .map((playlist) => (
                    <motion.div
                      key={playlist.id} // Asegúrate de que aquí uses playlist.id como key
                      className="flex items-center justify-between mb-2"
                      whileHover={{ scale: 1.05 }}
                    >
                      <Button
                        variant="ghost"
                        className="w-full text-left"
                        onClick={() => showPlaylistSongs(playlist.name)}
                      >
                        <span>{playlist.name}</span>
                      </Button>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            openCreateEditPlaylistPopup(true, playlist)
                          }
                        >
                          <Edit2 className="h-5 w-5 text-yellow-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            deletePlaylist(playlist.id, playlist.name)
                          }
                        >
                          <Trash className="h-5 w-5 text-red-500" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
              </ul>

              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-start border-white"
                  onClick={() => openCreateEditPlaylistPopup()}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span>Crear playlist</span>
                </Button>
              </motion.div>
            </div>
          </nav>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-[#181818] h-16 flex items-center justify-between px-4">
            <div className="flex items-center"></div>
            <div className="font-primaryCircular flex-1 max-w-xl px-4">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Buscar canciones, artistas o álbumes"
                  className="pl-8 bg-white bg-opacity-10 border-0 focus:ring-0 text-sm text-white placeholder-gray-400 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={toggleSettingsPopup}>
              <Avatar>
                <AvatarImage
                  src="https://static.wixstatic.com/media/cdb00b_e1464f187f5642aab5b1e09cb7e0381d~mv2.jpg/v1/fill/w_1507,h_1019,al_c/cdb00b_e1464f187f5642aab5b1e09cb7e0381d~mv2.jpg"
                  alt="@user"
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </Button>
          </header>

          <ScrollArea className="flex-1 pb-24">
            <h3 className="text-lg font-primaryCircular px-4 mt-4 mb-4">
              Canciones
            </h3>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-4 gap-4 px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {filteredDisplayedSongs.map((song) => (
                <motion.div
                  key={song.id}
                  className="bg-[#181818] p-4 rounded-lg hover:bg-[#282828] transition-colors group relative"
                >
                  <div className="relative aspect-square mb-3">
                    <img
                      src={song.coverUrl || "URL_DE_PLACEHOLDER"} // Cambia `song.cover` a `song.coverUrl`
                      alt={`Cover ${song.title}`}
                      className="w-full h-full object-cover rounded"
                    />

                    <div className="absolute bottom-2 right-2 flex gap-2">
                      <Button
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#ED1C24] hover:bg-[#af0e14] text-white"
                        onClick={() => openAddToPlaylistPopup(song)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#ED1C24] hover:bg-[#af0e14] text-white"
                        onClick={() => {
                          toggleLikeSong(song); // Marca o desmarca la canción como "Me Gusta"
                        }}
                      >
                        {likedSongs.some((liked) => liked.id === song.id) ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Heart className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#ED1C24] hover:bg-[#af0e14] text-white"
                        onClick={() => handleAddToQueue(song)}
                      >
                        <ListPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-primaryCircular text-sm font-medium truncate">
                        {song.title}
                      </h3>
                      <p className="text-xs text-gray-400 truncate">
                        {song.artist} {/* Muestra el nombre del artista */}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="ml-2 bg-[#ED1C24] hover:bg-[#af0e14] text-white"
                      onClick={() => handlePlaySong(song)}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </ScrollArea>

          {/* Modal para agregar a playlist */}
          {showAddToPlaylistPopup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-[#181818] border bg-[#181818] border-red-500 p-6 rounded-lg w-96 p-6 rounded-lg shadow-lg max-w-sm w-full">
                <div className="flex ">
                  <h2 className="text-lg font-primaryCircular mb-4">
                    Agregar a Playlist
                  </h2>
                  <div className="bg-[#3d3d3d] rounded-lg ms-32 mb-7 hover:bg-[#ED1C24]">
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={closeAddToPlaylistPopup}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                <div className="w-full bg-[#3d3d3d] rounded-lg hover:bg-[#ED1C24]">
                  <div className="w-full space-y-2">
                    {playlists.map((playlist) => (
                      <Button
                        key={playlist.name}
                        variant="ghost"
                        className="w-full text-left bg-[#3d3d3d] rounded-lg hover:bg-[#ED1C24]" // Agrega fondo y borde redondeado
                        onClick={() => handleAddSongToPlaylist(playlist.name)}
                      >
                        {playlist.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal para crear o editar playlist */}
          {showCreateEditPlaylistPopup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-[#181818] border bg-[#181818] border-red-500 p-6 rounded-lg w-96 p-6 rounded-lg shadow-lg max-w-sm w-full">
                <div className="flex ">
                  <h2 className="text-lg font-primaryCircular mb-4">
                    {isEditing ? "Editar playlist" : "Crear nueva playlist"}
                  </h2>
                  <div className="bg-[#3d3d3d] rounded-lg ms-28 mb-4 hover:bg-[#ED1C24]">
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={closeCreateEditPlaylistPopup}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                <div className="mb-4">
                  <Input
                    type="text"
                    placeholder="Nombre de la playlist"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className="text-white w-full mb-2"
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <Button
                    variant="ghost "
                    onClick={createOrUpdatePlaylist}
                    className="bg-[#3d3d3d] hover:bg-[#ED1C24]"
                  >
                    {isEditing ? "Actualizar" : "Crear"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Modal para la configuración */}
          {showSettingsPopup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-[#181818] border bg-[#181818] border-red-500 p-6 rounded-lg w-96 p-6 rounded-lg shadow-lg max-w-sm w-full">
                <div className="flex justify-between  items-center mb-4">
                  <h2 className="text-2xl font-primaryCircular">
                    Configuración
                  </h2>
                  <div className="bg-[#3d3d3d]  rounded-lg hover:bg-[#af0e14]">
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={toggleSettingsPopup}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl">Cuenta</h3>
                  <div className="flex items-center space-x-4 bg-[#3d3d3d] rounded-lg p-4 hover:bg-[#af0e14]">
                    <div className="relative">
                      <img
                        src="https://static.wixstatic.com/media/cdb00b_e1464f187f5642aab5b1e09cb7e0381d~mv2.jpg/v1/fill/w_1507,h_1019,al_c/cdb00b_e1464f187f5642aab5b1e09cb7e0381d~mv2.jpg" // Replace with the user's profile image URL
                        alt="Profile"
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          className="w-6 h-6 text-white"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </div>
                      <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                    <Button variant="ghost">Cambiar Foto</Button>
                  </div>
                  <h3 className="text-xl">Suscripción</h3>
                  <div className="space-y-4 bg-[#3d3d3d] rounded-lg hover:bg-[#af0e14]">
                    <Button variant="ghost" onClick={togglePlansPopup}>
                      Planes disponibles
                    </Button>
                  </div>
                  <h3 className="text-xl">Seguridad y privacidad</h3>
                  <div className="space-y-4 bg-[#3d3d3d] rounded-lg  hover:bg-[#af0e14]">
                    <Button variant="ghost" onClick={togglePasswordPopup}>
                      Cambiar contraseña
                    </Button>
                  </div>
                  <div className="space-y-4 bg-[#3d3d3d] rounded-lg hover:bg-[#af0e14]">
                    <Link
                      to="/login"
                      className="text-white hover:text-[#ED1C24] font-medium"
                    >
                      <Button variant="ghost">Cerrar sesión</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showPasswordPopup && (
            <div className="fixed inset-0 bg-black  bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-[#181818] p-6 border bg-[#181818] border-red-500 p-6 rounded-lg w-80 rounded-lg shadow-lg max-w-sm w-80">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-primaryCircular">
                    Cambiar contrasena
                  </h2>
                  <div className="bg-[#3d3d3d] rounded-lg hover:bg-[#af0e14]">
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={togglePasswordPopup}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                <div className=" mt-2 relative w-full">
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword1 ? "text" : "password"}
                      placeholder="Crea tu contraseña"
                      className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-400 pr-20 rounded-lg p-2"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword1(!showPassword1)}
                      className="absolute top-1/2 right-2 transform -translate-y-1/2 px-2 py-1 text-sm text-gray-400 hover:text-white focus:outline-none"
                    >
                      {showPassword1 ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                </div>

                <div className=" mt-2 relative w-full">
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Crea tu contraseña"
                      className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-400 pr-20 rounded-lg p-2"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 right-2 transform -translate-y-1/2 px-2 py-1 text-sm text-gray-400 hover:text-white focus:outline-none"
                    >
                      {showPassword ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col">
                  <Button variant="ghost" className="bg-[#ED1C24] mt-6">
                    {isEditing ? "Actualizar" : "Crear"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {showPlansPopup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="flex  gap-6 justify-center p-5">
                <div className="border bg-[#181818] border-red-500 p-6 rounded-lg w-80">
                  <div className="bg-[#3d3d3d] rounded-lg hover:bg-[#af0e14] p-1 inline-flex items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={togglePlansPopup}
                      className="p-1"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-2">
                      <span className="text-[#ED1C24]">Premium</span> Member
                    </h2>
                    <p className="text-xl mb-4">
                      <span className="text-[#ED1C24]">$179</span>/mes
                    </p>
                    <Button className="bg-[#3d3d3d] text-white hover:bg-[#af0e14] w-full font">
                      ÚNETE AHORA →
                    </Button>
                    <p className="text-sm mt-4">
                      La suscripción continúa automáticamente. <br />
                      Consulta los{" "}
                      <span className="text-[#ED1C24]">términos</span>.
                    </p>
                  </div>

                  <div className="space-y-4"></div>
                </div>
              </div>
            </div>
          )}
        </main>

        <aside className="w-[320px] bg-[#181818] border-l border-[#282828] flex flex-col flex-shrink-0">
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="mb-8">
              {queue.length > 0 ? (
                <>
                  <img
                    src={
                      queue[currentTrack]?.coverUrl ||
                      "https://via.placeholder.com/300"
                    }
                    alt="Now Playing"
                    className="w-full aspect-square object-cover rounded-lg shadow-lg mb-4" // Añade `mb-4` para margen inferior
                  />
                  <h2 className="text-xl font-primaryCircular">
                    {queue[currentTrack]?.title}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {queue[currentTrack]?.artist}
                  </p>
                </>
              ) : (
                <div className="font-primaryCircular text-gray-400 text-center">
                  No hay canciones en la cola
                </div>
              )}
            </div>

            {/* Aquí están los controles de reproducción */}
            <div className="font-primaryCircular flex justify-between items-center mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsShuffleOn(!isShuffleOn)}
                className={isShuffleOn ? "text-[#ED1C24]" : ""}
              >
                <Shuffle className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setCurrentTrack(
                    (currentTrack - 1 + queue.length) % queue.length
                  )
                }
                disabled={queue.length === 0}
              >
                <SkipBack className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                className="bg-white text-black rounded-full hover:bg-gray-200 h-12 w-12"
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={queue.length === 0}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-4" />
                ) : (
                  <Play className="h-6 w-5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setCurrentTrack((currentTrack + 1) % queue.length)
                }
                disabled={queue.length === 0}
              >
                <SkipForward className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsRepeatOn(!isRepeatOn)}
                className={isRepeatOn ? "text-[#ED1C24]" : ""}
              >
                <Repeat className="h-5 w-5" />
              </Button>
            </div>
            <div className="mb-6">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>
                  {!isNaN(currentTime) ? formatTime(currentTime) : "0:00"}
                </span>
                <span>{!isNaN(duration) ? formatTime(duration) : "0:00"}</span>
              </div>
              <input
                type="range"
                className="w-full"
                value={currentTime}
                max={duration}
                onChange={handleSeek}
                disabled={queue.length === 0}
              />
            </div>
            <div className="flex items-center justify-end mb-8">
              <Volume className="h-4 w-4" />
              <input
                type="range"
                value={volume}
                min="0"
                max="100"
                onChange={handleVolumeChange}
                className="w-24 ml-2"
              />
            </div>

            <div>
              <h3 className="text-lg font-primaryCircular mb-4">
                Cola de reproducción
              </h3>
              <ul className="space-y-2">
                {queue.map((song, index) => (
                  <SongItem
                    key={`${song.id}-${index}`}
                    song={song}
                    index={index}
                    moveSong={moveSong}
                    deleteSong={deleteSong}
                  />
                ))}
              </ul>
            </div>
          </div>
        </aside>

        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onCanPlay={() => {
            if (isPlaying) {
              audioRef.current.play().catch((error) => {
                console.error("Error al iniciar la reproducción:", error);
              });
            }
          }}
        />
      </div>
    </DndProvider>
  );
}
