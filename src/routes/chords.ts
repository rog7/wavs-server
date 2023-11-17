import express from "express";
import { SupabaseClient } from "@supabase/supabase-js";
import { auth } from "../middleware/auth";
import _ from "underscore";

const router = express.Router();

router.get("/", auth, async (req: any, res: any) => {
  const supabase = req.supabase as SupabaseClient;
  const user_id = req.user.sub;

  const showOnlyFavorites = req.query.show_only_favorites;

  let result: any;
  if (showOnlyFavorites === "false") {
    const { data, error } = await supabase
      .from("chords")
      .select("id, name, voicing, file_name");
    //   .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

    const { data: likes } = await supabase
      .from("chord_likes")
      .select("chord_id")
      .eq("user_id", user_id);

    const likedChordIds = likes!.map((like) => like.chord_id);

    result = data!.map((chord) => ({
      chord_id: chord.id,
      name: chord.name,
      "Chord Voicing": chord.voicing,
      liked: likedChordIds.includes(chord.id),
      file_name: chord.file_name,
    }));
  } else {
    // Grab favorites
    const { data: likes } = await supabase
      .from("chord_likes")
      .select("chord_id")
      .eq("user_id", user_id);
    //   .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

    const chordIds = likes!.map((like) => like.chord_id.toString()) as string[];

    const { data, error } = await supabase
      .from("chords")
      .select("id, name, voicing, file_name")
      .in("id", chordIds);

    const likedChordIds = likes?.map((like) => like.chord_id);

    if (likedChordIds) {
      if (data) {
        result = data!
          .filter((chord) => likedChordIds.includes(chord.id))
          .map((chord) => ({
            chord_id: chord.id,
            name: chord.name,
            "Chord Voicing": chord.voicing,
            liked: true,
            file_name: chord.file_name,
          }));
      } else {
        result = [];
      }
    } else {
      result = [];
    }
  }

  res.status(200).send({ result });
});

router.get("/filters", async (req: any, res: any) => {
  const supabase = req.supabase as SupabaseClient;

  const { data, error } = await supabase
    .from("filters")
    .select("id, name, subject, is_pro_filter")
    .order("id", { ascending: true });

  res.status(200).send({ result: data });
});

router.get("/filtered", auth, async (req: any, res: any) => {
  const supabase = req.supabase as SupabaseClient;
  const user_id = req.user.sub;

  const isProUser = req.user.isProUser;
  const ids = (req.query.ids as string).split(",");

  const { data: filteredChordIds } = await supabase
    .from("chord_filters_relation")
    .select("chord_id")
    .lt("chord_id", isProUser ? 1_000_000 : 15)
    .contains("filter_ids", ids);

  if (!filteredChordIds) return res.status(200).send({ result: [] });

  const { data: chords } = await supabase
    .from("chords")
    .select("id, name, voicing, file_name")
    .in(
      "id",
      filteredChordIds.map((chord) => chord.chord_id)
    );

  const { data: likes } = await supabase
    .from("chord_likes")
    .select("chord_id")
    .eq("user_id", user_id);

  const likedChordIds = likes!.map((like) => like.chord_id);

  const result = chords!.map((chord) => ({
    chord_id: chord.id,
    name: chord.name,
    "Chord Voicing": chord.voicing,
    liked: likedChordIds.includes(chord.id),
    file_name: chord.file_name,
  }));

  res.status(200).send({ result });
});

router.post("/like", auth, async (req: any, res: any) => {
  const supabase = req.supabase as SupabaseClient;
  const user_id = req.user.sub;

  const chord_id = req.body.chordId;
  const liked = req.body.liked;

  if (liked === undefined || !chord_id)
    return res.status(400).send({ message: "Missing parameters" });

  const { data: chord_likes, error } = await supabase
    .from("chord_likes")
    .select("user_id")
    .eq("user_id", user_id)
    .eq("chord_id", chord_id);

  if (chord_likes!.length == 0 && !liked)
    return res.status(400).send({ message: "Bad request" });

  if (chord_likes!.length > 0 && liked)
    return res.status(400).send({ message: "Bad request" });

  if (liked) {
    const { data, error } = await supabase
      .from("chord_likes")
      .insert([{ user_id, chord_id }])
      .select();

    if (error) return res.status(400).send({ message: "Bad request" });
    return res.send({ success: true });
  } else {
    const { error } = await supabase
      .from("chord_likes")
      .delete()
      .eq("user_id", user_id)
      .eq("chord_id", chord_id);

    return res.send({ success: true });
  }
});

router.get("/", auth, async (req: any, res: any) => {
  const supabase = req.supabase as SupabaseClient;
  const user_id = req.user.sub;

  const showOnlyFavorites = req.query.show_only_favorites;

  let result: any;
  if (showOnlyFavorites === "false") {
    const { data, error } = await supabase
      .from("chords")
      .select("id, name, voicing, file_name");
    //   .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

    const { data: likes } = await supabase
      .from("chord_likes")
      .select("chord_id")
      .eq("user_id", user_id);

    const likedChordIds = likes!.map((like) => like.chord_id);

    result = data!.map((chord) => ({
      chord_id: chord.id,
      name: chord.name,
      "Chord Voicing": chord.voicing,
      liked: likedChordIds.includes(chord.id),
      file_name: chord.file_name,
    }));
  } else {
    // Grab favorites
    const { data: likes } = await supabase
      .from("chord_likes")
      .select("chord_id")
      .eq("user_id", user_id);
    //   .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

    const chordIds = likes!.map((like) => like.chord_id.toString()) as string[];

    const { data, error } = await supabase
      .from("chords")
      .select("id, name, voicing, file_name")
      .in("id", chordIds);

    const likedChordIds = likes?.map((like) => like.chord_id);

    if (likedChordIds) {
      if (data) {
        result = data!
          .filter((chord) => likedChordIds.includes(chord.id))
          .map((chord) => ({
            chord_id: chord.id,
            name: chord.name,
            "Chord Voicing": chord.voicing,
            liked: true,
            file_name: chord.file_name,
          }));
      } else {
        result = [];
      }
    } else {
      result = [];
    }
  }

  res.status(200).send({ result });
});
export default router;
