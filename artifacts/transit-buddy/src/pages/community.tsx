import React from "react";
import { mockReviews, mockRouteChanges } from "@/lib/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MessageCircle, MapPin, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function Community() {
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Community Tips</h1>
        <p className="text-muted-foreground text-lg">Advice from other travelers like you.</p>
      </header>

      <Tabs defaultValue="reviews" className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-xl h-12 mb-6">
          <TabsTrigger value="reviews" className="rounded-lg text-base">Station Tips</TabsTrigger>
          <TabsTrigger value="routes" className="rounded-lg text-base">Route Changes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="reviews" className="space-y-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full h-14 rounded-2xl border-dashed border-2 text-primary font-semibold mb-4 bg-transparent hover:bg-accent">
                <Plus className="w-5 h-5 mr-2" /> Share a Station Tip
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl max-w-[90vw] p-6">
              <DialogHeader>
                <DialogTitle className="text-2xl text-center">Share a Tip</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Location</label>
                  <Button variant="outline" className="w-full justify-start h-12 rounded-xl">Select station...</Button>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Rating</label>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-8 h-8 text-muted stroke-[1.5px]" />)}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Your Tip</label>
                  <Textarea className="rounded-xl min-h-[100px]" placeholder="What should others know?" />
                </div>
                <Button className="w-full h-14 rounded-xl mt-4">Post Tip</Button>
              </div>
            </DialogContent>
          </Dialog>

          {mockReviews.map(review => (
            <Card key={review.id} className="rounded-2xl border-none shadow-sm">
              <CardContent className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center text-primary font-bold">
                    <MapPin className="w-4 h-4 mr-1" /> {review.location}
                  </div>
                  <div className="flex text-amber-500">
                    {[...Array(review.rating)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                  </div>
                </div>
                <p className="text-foreground text-lg leading-snug">"{review.tip}"</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {review.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="rounded-md font-normal capitalize">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="routes" className="space-y-4">
          <Button variant="outline" className="w-full h-14 rounded-2xl border-dashed border-2 text-primary font-semibold mb-4 bg-transparent hover:bg-accent">
            <Plus className="w-5 h-5 mr-2" /> Suggest Route Change
          </Button>

          {mockRouteChanges.map(route => (
            <Card key={route.id} className="rounded-2xl border-none shadow-sm">
              <CardContent className="p-5 space-y-4">
                <div className="bg-muted/50 p-3 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">Instead of</span>
                    <span className="line-through">{route.original}</span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-primary">
                    <span>Try</span>
                    <span>{route.suggested}</span>
                  </div>
                </div>
                <p className="text-foreground leading-snug">{route.reason}</p>
                <div className="flex flex-wrap gap-2">
                  {route.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="rounded-md font-normal bg-background">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
